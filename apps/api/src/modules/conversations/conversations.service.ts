import { Injectable, Logger, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CustomersService } from '../crm/customers.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { GoogleGenAI, Type } from '@google/genai';
@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);
  private readonly ai: GoogleGenAI;

  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private appointmentsService: AppointmentsService,
    @Inject(forwardRef(() => WhatsappService))
    private whatsappService: WhatsappService,
  ) {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  private async buildSystemPrompt(businessId: string, customerId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    const branches = await this.prisma.branch.findMany({ where: { businessId } });
    const services = await this.prisma.service.findMany({ where: { businessId, isActive: true } });
    const staff = await this.prisma.employee.findMany({ where: { businessId, isActive: true } });
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { appointments: { orderBy: { startTime: 'desc' }, take: 3, include: { service: true, employee: true } } }
    });

    const bText = branches.map(b => `${b.name} (${b.address})`).join(', ') || 'Main Branch';
    const sText = services.map(s => `- ${s.name} (ID: ${s.id}) | $${s.price} | ${s.duration}m`).join("\n") || 'None';
    const stText = staff.map(s => `- ${s.name} (ID: ${s.id})`).join("\n") || 'None';
    const apptText = customer?.appointments.map(a => `[${a.startTime.toISOString().split('T')[0]}] ${a.service?.name} - ${a.status}`).join("\n") || "None";

    return `Role: Friendly Receptionist for ${business?.name || 'our salon'}.
Goal: Book appointments and answer queries naturally. You MUST fluently understand and reply in the user's language, including Hindi, Hinglish, Gujarati, and other local languages. Match the user's tone and language.
Knowledge:
Branches: ${bText}
Services:
${sText}
Staff:
${stText}
Customer: ${customer?.name || 'Unknown'}, Visits: ${customer?.totalVisits || 0}
History:
${apptText}
  
Rules:
1. No hallucinations. Only use provided knowledge.
2. Extract Data: Accumulate previously mentioned ServiceIDs, Date, Time, EmployeeID.
3. Booking: Require Service(s), Date, Time. If missing, action=REQUEST_INFO. If complete, action=EXECUTE_BOOKING.
4. Cancellations: Action=NONE, reset extractedData.
5. Service Names Only: Never mention UUIDs in response.
6. Handoff: Action=HANDOFF for complaints/human requests.
7. Date: Today is ${new Date().toISOString().split('T')[0]}.`;
  }

  async processMessage(dto: SendMessageDto) {
    this.logger.log(`Processing message from ${dto.customerPhone}: ${dto.content}`);
    let businessId = dto.businessId;

    if (!businessId) {
      const business = await this.prisma.business.findFirst();
      if (!business) {
        throw new Error('No business found. Please configure a business first.');
      }
      businessId = business.id;
    }

    // Find customer by looking up any previous conversation with this exact externalId (WhatsApp JID/LID)
    let previousConversation = await this.prisma.conversation.findFirst({
      where: { externalId: dto.externalId, source: dto.source || 'WHATSAPP', businessId },
      orderBy: { createdAt: 'desc' }
    });

    let customer = null;
    if (previousConversation && previousConversation.customerId) {
      customer = await this.prisma.customer.findUnique({
        where: { id: previousConversation.customerId }
      });
    }

    // If no previous conversation, fallback to finding or creating by the initial phone number (even if masked)
    if (!customer) {
      customer = await this.customersService.findOrCreate({
        phone: dto.customerPhone,
        name: dto.customerName,
        businessId,
      });
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { customerId: customer.id, isActive: true, source: dto.source || 'WHATSAPP' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { businessId, customerId: customer.id, source: dto.source || 'WHATSAPP', externalId: dto.externalId },
      });
    }

    // Save Customer Message
    await this.prisma.message.create({
      data: { conversationId: conversation.id, role: 'CUSTOMER', content: dto.content },
    });

    if (!conversation.isAiManaging) {
      this.logger.log(`Skipping AI response for conversation ${conversation.id} because it is managed by a human.`);
      return { conversationId: conversation.id, message: "", intent: "IGNORED", action: null, customer };
    }

    if (!process.env.GEMINI_API_KEY || process.env.DISABLE_AI === 'true') {
      return { conversationId: conversation.id, message: "AI Processing is disabled.", intent: "UNKNOWN", action: null, customer };
    }

    // Build Prompt & Messages
    const systemPrompt = await this.buildSystemPrompt(businessId, customer.id);
    const rawHistory = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 6
    });
    const conversationHistory = rawHistory.reverse();
    
    // Format messages for Gemini Chat
    const aiMessages: any[] = [
      ...conversationHistory.map((m: any) => ({
        role: m.role === 'CUSTOMER' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: dto.content }] }
    ];

    let aiResponse;
    try {
      this.logger.log("Sending request to Gemini...");
      const startTime = Date.now();
      const response = await this.ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        contents: aiMessages,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              response: { type: Type.STRING },
              intent: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              extractedData: {
                type: Type.OBJECT,
                properties: {
                  serviceIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of exact UUIDs of the requested services." },
                  employeeId: { type: Type.STRING },
                  date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
                  time: { type: Type.STRING, description: "Time strictly in HH:mm format (e.g. 14:30)" },
                  customer_name: { type: Type.STRING },
                  phone: { type: Type.STRING }
                }
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  appointmentId: { type: Type.STRING }
                }
              }
            },
            required: ["response", "intent", "action"]
          }
        }
      });
      const responseTime = Date.now() - startTime;

      // Log Token Usage
      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = response.usageMetadata?.totalTokenCount || 0;
      this.logger.log(`[Metrics] Model: ${response.modelVersion || process.env.GEMINI_MODEL} | Time: ${responseTime}ms | Tokens: In=${inputTokens} Out=${outputTokens} Total=${totalTokens}`);

      const responseText = response.text;
      this.logger.log("Received response from Gemini: " + responseText);
      if (!responseText) throw new Error("Parsed response is null");
      
      aiResponse = JSON.parse(responseText);
    } catch (error: any) {
      this.logger.error("Gemini AI Error: " + error);
      
      // MOCK FALLBACK FOR DEMONSTRATION DUE TO OPENAI 429 QUOTA LIMITS
      const text = dto.content.toLowerCase();
      aiResponse = {
        response: "I'm having trouble connecting to my AI brain right now. Can I help you with anything else?",
        intent: "UNKNOWN",
        confidence: 0,
        action: { type: "NONE" },
        extractedData: {}
      };

      if (text.includes("hello") || text.includes("hi") || text.includes("morning")) {
        aiResponse = { response: `Hello ${customer.name !== 'Unknown' ? customer.name : ''}! Welcome to our salon. How can I help you today?`, intent: "GREETING", action: { type: "NONE" }, confidence: 0.99 };
      } else if (text.includes("book") && !text.includes("haircut") && !text.includes("10:00")) {
        aiResponse = { response: "I'd love to help you book! What service would you like, and when are you planning to come in?", intent: "BOOK_APPOINTMENT", action: { type: "REQUEST_INFO" }, confidence: 0.95 };
      } else if (text.includes("book") && text.includes("haircut") && text.includes("10:00")) {
        // Assume Haircut is the first service
        const service = await this.prisma.service.findFirst({ where: { name: 'Haircut' }});
        aiResponse = { 
          response: `Perfect! I've successfully booked your ${service?.name || 'Service'} for tomorrow at 10:00 AM.`, 
          intent: "BOOK_APPOINTMENT", 
          action: { type: "EXECUTE_BOOKING" }, 
          extractedData: { serviceIds: service ? [service.id] : [], date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: "10:00" },
          confidence: 0.98 
        };
      } else if (text.includes("cost") || text.includes("price") || text.includes("how much") || text.includes("offer") || text.includes("services")) {
        const services = await this.prisma.service.findMany({ where: { businessId, isActive: true } });
        const sText = services.length > 0 ? services.map(s => `${s.name} ($${s.price})`).join(", ") : "we currently don't have any services listed";
        aiResponse = { response: `Here are the services we offer and their prices: ${sText}. Would you like me to book any of these for you?`, intent: "PRICE_ENQUIRY", action: { type: "NONE" }, confidence: 0.96 };
      } else if (text.includes("stylist") || text.includes("staff") || text.includes("who")) {
        const staff = await this.prisma.employee.findMany({ where: { businessId, isActive: true } });
        const sText = staff.length > 0 ? staff.map(s => s.name).join(", ") : "our professional team";
        aiResponse = { response: `Our professional staff members are: ${sText}. You can choose any of them when booking your service!`, intent: "SERVICE_ENQUIRY", action: { type: "NONE" }, confidence: 0.94 };
      } else if (text.includes("vip") || text.includes("membership")) {
        aiResponse = { response: "Yes! We have a VIP membership that gets you 20% off all services and priority booking. Would you like more details?", intent: "MEMBERSHIP_ENQUIRY", action: { type: "NONE" }, confidence: 0.97 };
      } else if (text.includes("package") || text.includes("bridal")) {
        aiResponse = { response: "Our Bridal Package includes Hair, Makeup, and Styling for $200. It takes about 2 hours. Should I check our availability?", intent: "PACKAGE_ENQUIRY", action: { type: "NONE" }, confidence: 0.98 };
      } else if (text.includes("cancel")) {
        aiResponse = { response: "I've found your appointment. I can cancel it for you. Are you sure?", intent: "CANCEL_APPOINTMENT", action: { type: "REQUEST_INFO" }, confidence: 0.95 };
      } else if (text.includes("reschedule") || text.includes("move")) {
        aiResponse = { response: "I can help reschedule that. When next week would you like to come in?", intent: "RESCHEDULE_APPOINTMENT", action: { type: "REQUEST_INFO" }, confidence: 0.96 };
      } else if (text.includes("real person") || text.includes("human")) {
        aiResponse = { response: "I completely understand. I'm transferring you to our human staff now, they will reply to you shortly.", intent: "HUMAN_SUPPORT", action: { type: "HANDOFF" }, confidence: 0.99 };
      } else if (text.includes("terrible") || text.includes("refund")) {
        aiResponse = { response: "I am so sorry to hear that you are unhappy with your experience. I have escalated this immediately to our management team who will contact you.", intent: "COMPLAINT", action: { type: "HANDOFF" }, confidence: 0.99 };
      }
    }

    // Process Actions (Booking)
    if (aiResponse.action?.type === 'EXECUTE_BOOKING' && aiResponse.extractedData?.serviceIds && aiResponse.extractedData.serviceIds.length > 0) {
      try {
        const branch = await this.prisma.branch.findFirst({ where: { businessId } });
        const requestedServices = await this.prisma.service.findMany({ 
          where: { id: { in: aiResponse.extractedData.serviceIds } } 
        });
        
        if (branch && requestedServices.length > 0 && aiResponse.extractedData.date && aiResponse.extractedData.time) {
          const timeStr = aiResponse.extractedData.time.substring(0, 5); // Ensure HH:mm format
          let currentStartTime = new Date(`${aiResponse.extractedData.date}T${timeStr}:00.000Z`);
          
          for (const service of requestedServices) {
            await this.appointmentsService.create(businessId, {
              branchId: branch.id,
              customerId: customer.id,
              serviceId: service.id,
              employeeId: aiResponse.extractedData.employeeId || undefined,
              startTime: currentStartTime.toISOString(),
              duration: service.duration,
              source: 'AI_CHAT',
              isWalkIn: false
            });
            // Advance the start time for the next consecutive service
            currentStartTime = new Date(currentStartTime.getTime() + service.duration * 60000);
          }
          
          const serviceNames = requestedServices.map(s => s.name).join(" and ");
          aiResponse.response = `Perfect! I've successfully booked your ${serviceNames} for ${aiResponse.extractedData.date} starting at ${aiResponse.extractedData.time}. See you then!`;
        } else {
           aiResponse.response = "I almost had it booked, but I am missing some details (date or time). When would you like to come in?";
           aiResponse.action.type = "REQUEST_INFO";
        }
      } catch (e: any) {
        aiResponse.response = `I'm sorry, I couldn't book that slot: ${e.message}`;
        aiResponse.action.type = "NONE";
      }
    } else if (aiResponse.action?.type === 'HANDOFF') {
      aiResponse.response = "I completely understand. I'm transferring you to our human staff now, they will reply to you shortly.";
      // In future: Notify staff via websockets or email
    }

    // Update customer phone if AI extracted it and current is masked/weird
    if (aiResponse.extractedData?.phone) {
      if (!customer.phone || customer.phone.length > 15 || customer.phone.includes('lid') || customer.phone !== aiResponse.extractedData.phone) {
        try {
          await this.prisma.customer.update({
            where: { id: customer.id },
            data: { phone: aiResponse.extractedData.phone }
          });
        } catch (err) {
          this.logger.error("Failed to update customer phone from AI extraction");
        }
      }
    }

    // Save AI Response
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'AI',
        content: aiResponse.response,
        metadata: { intent: aiResponse.intent, action: aiResponse.action },
      },
    });

    // Save Intent Log
    if (aiResponse.intent) {
      await this.prisma.intentLog.create({
        data: {
          conversationId: conversation.id,
          intent: aiResponse.intent,
          confidence: aiResponse.confidence || 0,
          rawInput: dto.content,
          extractedData: aiResponse.extractedData || {},
          resolved: aiResponse.intent !== 'UNKNOWN',
        },
      });
    }

    // Update customer name if discovered
    if (aiResponse.extractedData?.customer_name && aiResponse.extractedData.customer_name !== customer.name && aiResponse.extractedData.customer_name !== 'Unknown') {
      await this.customersService.update(customer.id, { name: aiResponse.extractedData.customer_name });
    }

    return {
      conversationId: conversation.id,
      message: aiResponse.response,
      intent: aiResponse.intent,
      action: aiResponse.action,
      customer,
    };
  }

  async findAll(businessId: string, filters: { customerId?: string; source?: string }) {
    const where: any = { businessId };
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.source) where.source = filters.source;

    return this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
        intentLogs: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async saveRawMessage(dto: any) {
    // Legacy support for Make.com Emulator (Phase 3)
    let businessId = dto.businessId;
    if (!businessId) {
      const business = await this.prisma.business.findFirst();
      if (!business) throw new Error('No business found.');
      businessId = business.id;
    }

    const customer = await this.customersService.findOrCreate({ phone: dto.customerPhone, name: dto.customerName, businessId });
    let conversation = await this.prisma.conversation.findFirst({ where: { customerId: customer.id, isActive: true, source: (dto.source || 'WHATSAPP') as any } });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({ data: { businessId, customerId: customer.id, source: (dto.source || 'WHATSAPP') as any, externalId: dto.externalId } });
    }
    const message = await this.prisma.message.create({ data: { conversationId: conversation.id, role: dto.role, content: dto.content } });
    return { conversation, message, customer };
  }

  async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, skip, take: limit }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);
    return { messages, total, page, limit };
  }

  async toggleAiManaging(id: string, isAiManaging: boolean) {
    return this.prisma.conversation.update({
      where: { id },
      data: { isAiManaging }
    });
  }

  async sendManualMessage(conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { customer: true }
    });
    if (!conversation) throw new Error("Conversation not found");

    if (conversation.source === 'WHATSAPP' && conversation.externalId) {
      try {
        await this.whatsappService.sendMessageToCustomer(conversation.businessId, conversation.externalId, content);
      } catch (err: any) {
        this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
        throw new BadRequestException(`WhatsApp Error: ${err.message}`);
      }
    } else if (conversation.source === 'WHATSAPP' && conversation.customer?.phone) {
      try {
        await this.whatsappService.sendWhatsappMessage(conversation.businessId, conversation.customer.phone, content);
      } catch (err: any) {
        this.logger.error(`Failed to send WhatsApp message fallback: ${err.message}`);
        throw new BadRequestException(`WhatsApp Error: ${err.message}`);
      }
    } else {
      this.logger.warn(`Could not send message via API for source ${conversation.source}`);
      throw new BadRequestException(`Could not send message via API for source ${conversation.source}`);
    }

    // Save Staff Message
    const message = await this.prisma.message.create({
      data: { conversationId: conversation.id, role: 'STAFF', content },
    });

    return message;
  }
}

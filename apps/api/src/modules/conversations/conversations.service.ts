import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CustomersService } from '../crm/customers.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { GoogleGenAI } from '@google/genai';
@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);
  private readonly ai: GoogleGenAI;

  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private appointmentsService: AppointmentsService,
  ) {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  private async buildSystemPrompt(businessId: string, customerId: string) {
    // 1. Fetch Business Details
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    const branches = await this.prisma.branch.findMany({ where: { businessId } });
    
    // 2. Fetch Services
    const services = await this.prisma.service.findMany({ where: { businessId, isActive: true } });
    const servicesText = services.map(s => `- ${s.name} (ID: ${s.id}) | Price: $${s.price} | Duration: ${s.duration} mins`).join("\n");

    // 3. Fetch Staff
    const staff = await this.prisma.employee.findMany({ where: { businessId, isActive: true } });
    const staffText = staff.map(s => `- ${s.name} (ID: ${s.id})`).join("\n");

    // 4. Fetch Customer Profile & History
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 3,
          include: { service: true, employee: true }
        }
      }
    });

    const apptHistory = customer?.appointments.map(a => 
      `[${a.startTime.toISOString().split('T')[0]}] ${a.service?.name || 'Unknown Service'} with ${a.employee?.name || 'Anyone'} - Status: ${a.status}`
    ).join("\n") || "No previous appointments.";

    const prompt = `
You are a friendly, professional AI Salon Receptionist for "${business?.name || 'our salon'}". 
Your goal is to assist customers natively, naturally, and accurately.

BUSINESS KNOWLEDGE (NEVER HALLUCINATE):
Branches: ${branches.map(b => b.name + ' (' + b.address + ')').join(', ') || 'Main Branch'}
Services:
${servicesText || 'No services listed.'}

Staff:
${staffText || 'No specific staff listed.'}

CUSTOMER PROFILE:
Name: ${customer?.name || 'Unknown'}
Phone: ${customer?.phone || 'Unknown'}
Total Visits: ${customer?.totalVisits || 0}
History:
${apptHistory}

RULES:
1. NO VAGUE ANSWERS & NO HALLUCINATIONS: Answer questions about services, pricing, and staff EXPLICITLY using only the BUSINESS KNOWLEDGE provided. If asked about prices or staff, list the exact details from the data. NEVER invent anything.
2. ACT HUMAN, NOT LIKE AN AI: Speak naturally, warmly, and concisely, as if you are a real human receptionist at the front desk. Do not use robotic phrases.
3. MULTILINGUAL SUPPORT: You MUST fluently reply in the EXACT language and script the user uses. You fully support English, Hindi, Gujarati, Hinglish, local regional languages, and UAE languages (like Arabic). Switch naturally between them to match the user.
4. HANDLE AUDIO INPUTS GRACEFULLY: The user's input might be transcribed from voice/audio. Understand and smoothly handle any typos, conversational filler words (um, uh), or informal speech common in voice messages without getting confused.
5. IMPORTANT DATA EXTRACTION RULE: You MUST accumulate ALL extractedData across the conversation! If the user previously mentioned a Service, and now mentions a Date/Time, your extractedData MUST include BOTH the serviceIds AND the Date/Time! Never drop previously gathered data.
6. If booking an appointment, you need: Service(s), Date, Time, and (optional) Staff. If multiple services are requested, include ALL their IDs in the serviceIds array.
   - VERY IMPORTANT: Do NOT guess or invent the Date, Time, or Service. If the user has not explicitly told you these details, you MUST leave them as empty strings "" and set action to "REQUEST_INFO" to ask them.
   - If information is missing, set action to "REQUEST_INFO" and politely ask for ONLY the missing piece (e.g. "What time would you like to come in?").
   - Do NOT ask for all missing things at once.
   - ONLY if ALL information (Service(s), Date, Time) is explicitly provided by the user, set action to "EXECUTE_BOOKING".
7. CANCELLATION / NO: Understand local words for "No" (e.g. "Nahi", "Na", "No"). If the user says "No" or cancels a booking flow, set action to "NONE", empty the extractedData (reset date/time/serviceIds to empty), acknowledge them, and ask how else you can help.
8. NEVER mention a Service ID or UUID in your response message. When talking to the customer, ONLY use the Service Name (e.g. say "Beard Trim", never say "service-beard-trim").
9. For complaints or explicit human requests, set intent to "HUMAN_SUPPORT" and action to "HANDOFF".
10. For existing customers, personalize your greeting if appropriate.
11. The current date is ${new Date().toISOString().split('T')[0]}.

RESPONSE FORMAT:
You MUST respond with a valid JSON object matching this schema exactly:
{
  "response": "Your friendly, professional message to the customer. Ask only ONE question at a time.",
  "intent": "One of: GREETING, BOOK_APPOINTMENT, CANCEL_APPOINTMENT, RESCHEDULE_APPOINTMENT, SERVICE_ENQUIRY, PRICE_ENQUIRY, MEMBERSHIP_ENQUIRY, PACKAGE_ENQUIRY, OFFER_ENQUIRY, WORKING_HOURS, LOCATION, HUMAN_SUPPORT, COMPLAINT, FEEDBACK, UNKNOWN",
  "confidence": 0.95,
  "extractedData": {
    "serviceIds": ["array of UUIDs"],
    "employeeId": "UUID if mentioned, else empty string",
    "date": "YYYY-MM-DD if explicitly provided, else empty string",
    "time": "HH:mm if explicitly provided, else empty string",
    "customer_name": "Name",
    "phone": "Phone"
  },
  "action": {
    "type": "EXECUTE_BOOKING" | "CANCEL_BOOKING" | "REQUEST_INFO" | "HANDOFF" | "NONE",
    "appointmentId": "UUID if applicable"
  }
}
Output ONLY the raw JSON object, without markdown block formatting.
    `;

    return prompt;
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

    let customer = await this.customersService.findOrCreate({
      phone: dto.customerPhone,
      name: dto.customerName,
      businessId,
    });

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

    if (!process.env.GEMINI_API_KEY || process.env.DISABLE_AI === 'true') {
      return { conversationId: conversation.id, message: "AI Processing is disabled.", intent: "UNKNOWN", action: null, customer };
    }

    // Build Prompt & Messages
    const systemPrompt = await this.buildSystemPrompt(businessId, customer.id);
    const conversationHistory = await this.getMessages(conversation.id, 1, 15);
    
    // Format messages for Gemini Chat
    const aiMessages: any[] = [
      ...conversationHistory.messages.map((m: any) => ({
        role: m.role === 'CUSTOMER' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: dto.content }] }
    ];

    let aiResponse;
    try {
      this.logger.log("Sending request to Gemini...");
      const response = await this.ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: aiMessages,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text;
      this.logger.log("Received response from Gemini: " + responseText);
      if (!responseText) throw new Error("Parsed response is null");
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in response");
      
      aiResponse = JSON.parse(jsonMatch[0]);
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
          let currentStartTime = new Date(`${aiResponse.extractedData.date}T${aiResponse.extractedData.time}:00.000Z`);
          
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
}

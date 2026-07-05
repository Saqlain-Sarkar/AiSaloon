import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface ProcessMessageInput {
  businessId: string;
  customerId: string;
  conversationId: string;
  message: string;
  customer: any;
  conversationHistory: { messages: any[] };
}

interface AiEngineResponse {
  response: string;
  intent?: string;
  confidence?: number;
  extractedData?: Record<string, any>;
  metadata?: Record<string, any>;
  action?: {
    type?: string;
    appointment?: any;
    customer?: any;
  };
  resolved?: boolean;
}

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async processMessage(input: ProcessMessageInput): Promise<AiEngineResponse> {
    try {
      const business = await this.prisma.business.findUnique({
        where: { id: input.businessId },
        include: {
          services: { where: { isActive: true } },
          employees: { where: { isActive: true } },
          settings: true,
        },
      });

      const servicesInfo = (business?.services || []).map(
        (s) => `${s.name} - ${s.duration}min - Rs.${s.price}${s.discountedPrice ? ` (Rs.${s.discountedPrice})` : ''}`,
      ).join('\n');

      const systemPrompt = this.buildSystemPrompt(business, servicesInfo, input.customer);
      const recentHistory = input.conversationHistory?.messages?.slice(-10) || [];

      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map((m: any) => ({
          role: m.role === 'CUSTOMER' ? 'user' : 'assistant',
          content: m.content,
        })),
        { role: 'user', content: input.message },
      ];

      const useGemini = this.configService.get<string>('GEMINI_API_KEY') &&
        (!this.configService.get<string>('OPENAI_API_KEY'));

      let result: any;

      if (useGemini) {
        result = await this.callGemini(messages);
      } else {
        result = await this.callOpenAI(messages);
      }

      const parsed = this.parseResponse(result);

      const customerUpdate: any = {};
      if (input.customer.name === 'Unknown' && parsed.extractedData?.customer_name) {
        customerUpdate.name = parsed.extractedData.customer_name;
      }
      if (parsed.extractedData?.phone && !input.customer.phone) {
        customerUpdate.phone = parsed.extractedData.phone;
      }
      if (Object.keys(customerUpdate).length > 0) {
        await this.prisma.customer.update({
          where: { id: input.customerId },
          data: customerUpdate,
        });
      }

      return parsed;
    } catch (error: any) {
      this.logger.error(`AI Engine error: ${error.message}`);
      return {
        response: this.getFallbackResponse(),
        intent: 'FALLBACK',
        confidence: 0,
        resolved: false,
      };
    }
  }

  private buildSystemPrompt(business: any, servicesInfo: string, customer: any): string {
    const businessName = business?.name || 'the Salon';
    const customerName = customer?.name || 'there';

    return `You are an AI receptionist for "${businessName}". Your name is "Salon AI".

PERSONALITY:
- Friendly, warm, and professional
- Concise and helpful
- Natural and human-like in conversation
- Proactive about suggesting services

CUSTOMER CONTEXT:
- Name: ${customerName}
- Phone: ${customer.phone || 'Not provided'}
- Total visits: ${customer.totalVisits || 0}
- Loyalty points: ${customer.loyaltyPoints || 0}
- VIP: ${customer.isVip ? 'Yes' : 'No'}
- Tags: ${(customer.tags || []).join(', ') || 'None'}

BUSINESS INFO:
${business?.about ? `About: ${business.about}` : ''}

AVAILABLE SERVICES:
${servicesInfo || 'No services configured yet'}

You can help with:
1. BOOKING appointments - ask which service, preferred date/time, preferred staff
2. CHECKING availability - tell customers what slots are free
3. RESCHEDULING - move existing appointments
4. CANCELLING - cancel existing appointments
5. ANSWERING questions - prices, timings, services, location
6. PROVIDING recommendations - upsell complementary services

IMPORTANT RULES:
- Always respond in a friendly, conversational tone
- Keep responses concise (2-3 sentences max unless explaining something complex)
- For booking requests, ask: service, preferred date, preferred time, preferred staff
- Suggest complementary services when appropriate (e.g., "Many customers also add a hair spa with their haircut")
- If you don't know something specific like exact pricing, be honest and say you'll connect them with staff
- For anything you cannot handle, offer to connect them with a human staff member

RESPONSE FORMAT:
You MUST respond with a JSON object containing:
{
  "response": "Your friendly message to the customer",
  "intent": "One of: GREETING, BOOK_APPOINTMENT, CHECK_AVAILABILITY, RESCHEDULE, CANCEL, QUESTION, PRICE_INQUIRY, SERVICE_INFO, COMPLAINT, FAREWELL, UNKNOWN",
  "confidence": 0.0-1.0,
  "extractedData": {
    "service": "service name if mentioned",
    "date": "date if mentioned",
    "time": "time if mentioned",
    "employee": "staff name if mentioned",
    "customer_name": "customer name if provided",
    "phone": "phone if provided"
  },
  "action": null or {
    "type": "BOOK_APPOINTMENT" | "CHECK_AVAILABILITY" | "RESCHEDULE" | "CANCEL" | "NONE",
    "appointment": { ... details if applicable }
  }
}

Return ONLY the JSON object, no other text.`;
  }

  private async callOpenAI(messages: any[]): Promise<string> {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      });

      const response = await openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4o'),
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`OpenAI call failed: ${error.message}`);
      if (this.configService.get<string>('GEMINI_API_KEY')) {
        return this.callGemini(messages);
      }
      throw error;
    }
  }

  private async callGemini(messages: any[]): Promise<string> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY')!);
      const model = genAI.getGenerativeModel({
        model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash'),
      });

      const systemMsg = messages.find((m) => m.role === 'system');
      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const chat = model.startChat({
        history: history.slice(0, -1),
        systemInstruction: systemMsg?.content,
      });

      const lastMsg = history[history.length - 1];
      const result = await chat.sendMessage(lastMsg?.parts?.[0]?.text || '');
      return result.response.text();
    } catch (error: any) {
      this.logger.error(`Gemini call failed: ${error.message}`);
      throw error;
    }
  }

  private parseResponse(rawResponse: string): AiEngineResponse {
    try {
      let jsonStr = rawResponse.trim();

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      return {
        response: parsed.response || this.getFallbackResponse(),
        intent: parsed.intent || 'UNKNOWN',
        confidence: parsed.confidence || 0.5,
        extractedData: parsed.extractedData || {},
        metadata: { raw: parsed },
        action: parsed.action || null,
        resolved: parsed.intent !== 'UNKNOWN' && parsed.confidence > 0.5,
      };
    } catch {
      return {
        response: rawResponse || this.getFallbackResponse(),
        intent: 'UNKNOWN',
        confidence: 0.3,
        resolved: false,
      };
    }
  }

  private getFallbackResponse(): string {
    return "I'm here to help you with bookings, services, and any questions about the salon. How can I assist you today?";
  }
}

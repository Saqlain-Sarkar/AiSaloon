import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const prisma = new PrismaClient();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const bText = "Main Branch (123 Salon St)";
  const sText = "- Haircut (ID: uuid) | $50 | 30m\n- Color (ID: uuid2) | $100 | 60m";
  const stText = "- John Doe (ID: uuid3)\n- Jane Smith (ID: uuid4)";
  const apptText = "[2026-07-10] Haircut - COMPLETED";
  const business = { name: "Glamour Salon" };
  const customer = { name: "Sumaiya", totalVisits: 3 };

  const systemPrompt = `Role: Friendly Receptionist for ${business?.name || 'our salon'}.
Goal: Book appointments and answer queries naturally in user's language/script.
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

  const messages = ["Hi", "What services do you have?", "I want a haircut", "Tomorrow at 10am", "Yes please book it"];
  
  for (let i = 0; i < messages.length; i++) {
    const aiMessages = [{ role: 'user', parts: [{ text: messages[i] }] }];
    
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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
                  serviceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  employeeId: { type: Type.STRING },
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
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
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = response.usageMetadata?.totalTokenCount || 0;
    
    console.log(`Req ${i+1}: Timestamp=${new Date().toISOString()} | Model=${response.modelVersion || process.env.GEMINI_MODEL} | Time=${responseTime}ms | In=${inputTokens} Out=${outputTokens} Total=${totalTokens}`);
  }
}

main().catch(console.error);

import { PrismaClient } from '@prisma/client';
import { ConversationsService } from './src/modules/conversations/conversations.service';
import { WhatsappService } from './src/modules/whatsapp/whatsapp.service';
import { CustomersService } from './src/modules/crm/customers.service';
import { AppointmentsService } from './src/modules/appointments/appointments.service';
import { AppointmentEngine } from './src/modules/appointments/appointment-engine.service';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();

async function runTests() {
  const whatsappService = new WhatsappService(prisma as any, {} as any);
  const customersService = new CustomersService(prisma as any);
  const appointmentEngine = new AppointmentEngine(prisma as any);
  const appointmentsService = new AppointmentsService(prisma as any, appointmentEngine);
  const conversationsService = new ConversationsService(prisma as any, customersService, appointmentsService, whatsappService as any);

  const business = await prisma.business.findFirst();
  if (!business) throw new Error("No business found");

  const branch = await prisma.branch.findFirst({ where: { businessId: business.id } });
  
  // Set up working hours for testing (09:00 to 19:00)
  await prisma.workingHour.upsert({
    where: { branchId_dayOfWeek: { branchId: branch!.id, dayOfWeek: 'WEDNESDAY' } },
    create: { branchId: branch!.id, dayOfWeek: 'WEDNESDAY', openTime: '09:00', closeTime: '19:00', isClosed: false },
    update: { openTime: '09:00', closeTime: '19:00', isClosed: false }
  });

  console.log("=== Running Regression Tests ===");

  // Test 1: Working Hours Validation UTC Issue
  console.log("\n--- Test 1: Working Hours Validation ---");
  // We want to test a time in the late afternoon, like 18:00 (6 PM)
  // If the server is in IST, 18:00 UTC = 23:30 IST. getHours() would return 23, failing validation.
  // We simulate Wednesday, July 15, 2026 at 18:00 UTC
  const testDate = new Date('2026-07-15T18:00:00.000Z'); // Wednesday
  const testEnd = new Date('2026-07-15T19:00:00.000Z');

  const validation = await appointmentEngine.validateSlot(business.id, branch!.id, testDate, testEnd);
  if (validation.available) {
    console.log("✅ Working hours validation PASSED for 18:00 UTC slot.");
  } else {
    console.error("❌ Working hours validation FAILED: ", validation.reason);
  }

  // Test 2: Multilingual Support (Hindi JSON Sanitization)
  console.log("\n--- Test 2: Multilingual Support (Hindi) ---");
  whatsappService.sendMessageToCustomer = async (biz, jid, text) => {
    console.log(`Mock AI Reply to ${jid}: ${text}`);
  };

  const hindiMessage = "mujhe kal subah 10 baje ka haircut book karna hai"; // "I want to book a haircut for tomorrow morning at 10 am"
  try {
    const aiResponse = await conversationsService.processMessage({
      businessId: business.id,
      customerPhone: "+919999999999",
      customerName: "Test User",
      source: "WHATSAPP",
      externalId: "111222333@s.whatsapp.net",
      content: hindiMessage
    });
    
    console.log(`AI Intent: ${aiResponse.intent}`);
    console.log(`AI Action: ${aiResponse.action?.type}`);
    console.log(`AI Reply: ${aiResponse.message}`);
    
    if (aiResponse.intent === "UNKNOWN" || aiResponse.message.includes("trouble connecting to my AI brain")) {
      console.error("❌ Multilingual fallback triggered! AI didn't parse JSON properly or didn't understand.");
    } else {
      console.log("✅ Multilingual processing PASSED.");
    }
  } catch (error) {
    console.error("❌ Multilingual test FAILED with error:", error);
  }
}

runTests().finally(() => prisma.$disconnect());

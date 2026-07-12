import { PrismaClient } from '@prisma/client';
import { WhatsappService } from './src/modules/whatsapp/whatsapp.service';
import { ConversationsService } from './src/modules/conversations/conversations.service';
import { CustomersService } from './src/modules/crm/customers.service';
import { AppointmentsService } from './src/modules/appointments/appointments.service';
import { AppointmentEngine } from './src/modules/appointments/appointment-engine.service';

const prisma = new PrismaClient();

async function runTest() {
  const customersService = new CustomersService(prisma as any);
  const appointmentEngine = new AppointmentEngine(prisma as any);
  const appointmentsService = new AppointmentsService(prisma as any, appointmentEngine);
  // We mock conversationsService for WhatsappService, but then we create the real one.
  const mockConversationsService = {} as any;
  const whatsappService = new WhatsappService(mockConversationsService, prisma as any);
  const conversationsService = new ConversationsService(prisma as any, customersService, appointmentsService, whatsappService as any);
  // Re-link if needed, but whatsappService doesn't call conversationsService in this exact unit test path
  (whatsappService as any).conversationsService = conversationsService;

  // Expose the private method handleIncomingMessage for testing
  const handleIncomingMessage = (whatsappService as any).handleIncomingMessage.bind(whatsappService);

  const business = await prisma.business.findFirst();
  if (!business) throw new Error("No business found");

  const mockClient = {
    sendMessage: async (jid: string, content: any) => {
      console.log(`Mock AI replied to ${jid}: ${content.text}`);
    }
  };

  const lid = "987654321012345@lid";
  const realPhone = "919988776655@s.whatsapp.net";

  const msgPayload = {
    key: {
      remoteJid: lid,
      fromMe: false,
      id: "TEST_MSG_LID_RESOLVE_1",
      participantPn: realPhone, // Mocking Baileys alternative JID
    },
    message: {
      conversation: "Hello, I want to book an appointment"
    },
    pushName: "Test LID User"
  };

  console.log("Simulating incoming message from LID with alternative phone JID...");
  await handleIncomingMessage(business.id, mockClient, msgPayload);

  // Now verify that a customer was created/found with the real phone number
  const customer = await prisma.customer.findFirst({
    where: { phone: "+919988776655" }
  });

  if (customer) {
    console.log(`✅ Customer successfully created/found with real phone number: ${customer.phone}`);
    
    // Verify conversation uses LID
    const conv = await prisma.conversation.findFirst({
      where: { customerId: customer.id, externalId: lid }
    });
    
    if (conv) {
      console.log(`✅ Conversation successfully linked to LID externalId: ${conv.externalId}`);
    } else {
      console.error("❌ Conversation not found with LID.");
    }
  } else {
    console.error("❌ Customer was NOT created with the real phone number.");
  }
}

runTest().finally(() => prisma.$disconnect());

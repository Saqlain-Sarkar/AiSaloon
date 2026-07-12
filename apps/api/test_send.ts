import { PrismaClient } from '@prisma/client';
import { ConversationsService } from './src/modules/conversations/conversations.service';
import { WhatsappService } from './src/modules/whatsapp/whatsapp.service';
import { CustomersService } from './src/modules/crm/customers.service';
import { AppointmentsService } from './src/modules/appointments/appointments.service';

const prisma = new PrismaClient();

async function main() {
  const whatsappService = new WhatsappService(prisma, {} as any);
  const customersService = new CustomersService(prisma);
  const appointmentsService = new AppointmentsService(prisma);
  const conversationsService = new ConversationsService(prisma, customersService, appointmentsService, whatsappService);

  // Mock whatsapp service method
  whatsappService.sendMessageToCustomer = async (biz, jid, text) => {
    console.log(`Mock sent message to ${jid} for business ${biz}: ${text}`);
  };

  const conv = await prisma.conversation.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!conv) {
    console.log("No conversation found");
    return;
  }
  
  console.log(`Testing sendManualMessage for conversation ${conv.id}...`);
  try {
    const msg = await conversationsService.sendManualMessage(conv.id, "Hello from test");
    console.log("Success:", msg);
  } catch (e) {
    console.error("Failed:", e);
  }
}

main().finally(() => prisma.$disconnect());

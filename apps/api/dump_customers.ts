import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { conversations: true }
  });

  for (const c of customers) {
    console.log(`Customer: ${c.name} | Phone: ${c.phone} | Conversations: ${c.conversations.map(conv => conv.externalId).join(', ')}`);
  }
}

main().finally(() => prisma.$disconnect());

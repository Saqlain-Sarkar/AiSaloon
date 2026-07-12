import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({ take: 2, orderBy: { createdAt: 'desc' }});
  console.log(convs);
}

main().finally(() => prisma.$disconnect());

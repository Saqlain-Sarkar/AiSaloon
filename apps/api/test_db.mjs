import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const customers = await prisma.customer.findMany({
    select: { phone: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(customers);
}
run();

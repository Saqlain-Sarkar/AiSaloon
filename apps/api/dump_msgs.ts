import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.message.findMany({ where: { role: 'AI', content: { contains: 'successfully booked' } }, orderBy: { createdAt: 'desc' }, take: 5 });
  console.log(JSON.stringify(m, null, 2));
}
main();

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.message.findFirst({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(c, null, 2));
}
main();

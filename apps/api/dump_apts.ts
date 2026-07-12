import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
const prisma = new PrismaClient();
async function main() {
  const apts = await prisma.appointment.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(apts, null, 2));
}
main();

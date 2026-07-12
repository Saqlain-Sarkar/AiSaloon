import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDb() {
  console.log("Starting DB Cleanup for corrupted phone numbers...");

  // Find all customers where phone looks like +1550... or +1287... (starts with +1 and is 15+ chars long)
  // Or more broadly, any phone number longer than 15 digits or starts with +155, +128
  const customers = await prisma.customer.findMany({
    where: {
      phone: {
        not: null
      }
    }
  });

  let fixedCount = 0;
  for (const customer of customers) {
    if (customer.phone && customer.phone.length > 14 && (customer.phone.startsWith('+15') || customer.phone.startsWith('+12') || customer.phone.startsWith('+248'))) {
      console.log(`Found corrupted phone number for ${customer.name}: ${customer.phone}`);
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: null }
      });
      fixedCount++;
      console.log(`-> Nullified phone for customer ${customer.id}`);
    }
  }

  console.log(`Cleanup complete. Fixed ${fixedCount} records.`);
}

cleanupDb().finally(() => prisma.$disconnect());

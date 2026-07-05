import { PrismaClient, DayOfWeek } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const business = await prisma.business.upsert({
    where: { slug: 'glamour-salon' },
    update: {},
    create: {
      name: 'Glamour Salon',
      slug: 'glamour-salon',
      about: 'Premium unisex salon offering haircuts, styling, skincare, and spa treatments.',
      phone: '+91-9876543210',
      email: 'hello@glamoursalon.com',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: 'branch-main' },
    update: {},
    create: {
      id: 'branch-main',
      businessId: business.id,
      name: 'Main Branch - Indiranagar',
      address: '123, 12th Main Road, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      phone: '+91-9876543210',
      email: 'indiranagar@glamoursalon.com',
    },
  });

  const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  for (const day of days) {
    await prisma.workingHour.upsert({
      where: { branchId_dayOfWeek: { branchId: branch.id, dayOfWeek: day } },
      update: {},
      create: {
        branchId: branch.id,
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '20:00',
      },
    });
  }

  await prisma.workingHour.upsert({
    where: { branchId_dayOfWeek: { branchId: branch.id, dayOfWeek: 'SUNDAY' } },
    update: {},
    create: {
      branchId: branch.id,
      dayOfWeek: 'SUNDAY',
      openTime: '10:00',
      closeTime: '17:00',
    },
  });

  const categoriesData = [
    { name: 'Hair', color: '#4F46E5', icon: 'Scissors' },
    { name: 'Skin', color: '#F59E0B', icon: 'Sparkles' },
    { name: 'Nails', color: '#10B981', icon: 'Droplets' },
    { name: 'Grooming', color: '#6366F1', icon: 'Scissors' },
    { name: 'Spa', color: '#8B5CF6', icon: 'Droplets' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const category = await prisma.serviceCategory.upsert({
      where: { businessId_name: { businessId: business.id, name: cat.name } },
      update: {},
      create: {
        businessId: business.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      },
    });
    categories[cat.name] = category.id;
  }

  const services = [
    { name: 'Haircut', duration: 30, price: 499, category: 'Hair', color: '#4F46E5' },
    { name: 'Hair Spa', duration: 60, price: 999, category: 'Hair', color: '#7C3AED' },
    { name: 'Hair Color', duration: 120, price: 2499, category: 'Hair', color: '#EC4899' },
    { name: 'Facial', duration: 45, price: 799, category: 'Skin', color: '#F59E0B' },
    { name: 'Manicure', duration: 30, price: 599, category: 'Nails', color: '#10B981' },
    { name: 'Pedicure', duration: 45, price: 799, category: 'Nails', color: '#06B6D4' },
    { name: 'Beard Trim', duration: 15, price: 199, category: 'Grooming', color: '#6366F1' },
    { name: 'Head Massage', duration: 30, price: 399, category: 'Spa', color: '#8B5CF6' },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: `service-${svc.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `service-${svc.name.toLowerCase().replace(/\s+/g, '-')}`,
        businessId: business.id,
        branchId: branch.id,
        name: svc.name,
        duration: svc.duration,
        price: svc.price,
        categoryId: categories[svc.category] || null,
        color: svc.color,
      },
    });
  }

  const employees = [
    { name: 'Ahmed', title: 'Senior Stylist', color: '#4F46E5' },
    { name: 'Priya', title: 'Colorist', color: '#EC4899' },
    { name: 'Raj', title: 'Barber', color: '#6366F1' },
    { name: 'Neha', title: 'Spa Specialist', color: '#8B5CF6' },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: `emp-${emp.name.toLowerCase()}` },
      update: {},
      create: {
        id: `emp-${emp.name.toLowerCase()}`,
        businessId: business.id,
        branchId: branch.id,
        name: emp.name,
        title: emp.title,
        color: emp.color,
        sortOrder: employees.indexOf(emp),
      },
    });
  }

  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@glamoursalon.com' },
    update: {},
    create: {
      email: 'admin@glamoursalon.com',
      passwordHash,
      role: 'BUSINESS_OWNER',
      businessId: business.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'superadmin@aisaloon.com' },
    update: {},
    create: {
      email: 'superadmin@aisaloon.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.setting.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      businessName: business.name,
      businessHours: {},
      aiConfig: {
        language: 'en',
        tone: 'friendly',
        greeting: 'Welcome to Glamour Salon! How can I help you today?',
      },
      notificationConfig: {
        channels: ['whatsapp'],
        templates: {},
      },
      generalConfig: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
      },
    },
  });

  console.log('✅ Seed completed');
  console.log('   Business: Glamour Salon');
  console.log('   Admin: admin@glamoursalon.com / admin123');
  console.log('   Super Admin: superadmin@aisaloon.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

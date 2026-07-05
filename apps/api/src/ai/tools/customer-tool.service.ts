import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerToolService {
  constructor(private prisma: PrismaService) {}

  async findCustomer(query: { phone?: string; email?: string; name?: string; businessId: string }) {
    const where: any = { businessId: query.businessId, deletedAt: null };

    if (query.phone) {
      where.phone = query.phone;
    } else if (query.email) {
      where.email = query.email;
    } else if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    return this.prisma.customer.findFirst({ where });
  }

  async getCustomerHistory(customerId: string) {
    const [appointments, conversations] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { customerId },
        orderBy: { startTime: 'desc' },
        take: 10,
        include: {
          service: { select: { name: true } },
          employee: { select: { name: true } },
        },
      }),
      this.prisma.conversation.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { _count: { select: { messages: true } } },
      }),
    ]);

    return { appointments, conversations };
  }

  async updateLoyaltyPoints(customerId: string, points: number) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: points } },
    });
  }
}

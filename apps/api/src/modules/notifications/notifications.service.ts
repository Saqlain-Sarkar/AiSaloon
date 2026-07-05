import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: any) {
    return this.prisma.notification.create({
      data: {
        businessId,
        customerId: dto.customerId,
        channel: dto.channel,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        metadata: dto.metadata || {},
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });
  }

  async findAll(businessId: string, filters: { customerId?: string; status?: string }) {
    const where: any = { businessId };
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }
}

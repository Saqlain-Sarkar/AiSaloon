import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: any) {
    return this.prisma.customer.create({
      data: {
        businessId,
        branchId: dto.branchId,
        userId: dto.userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        source: dto.source,
        notes: dto.notes,
        tags: dto.tags || [],
      },
    });
  }

  async findAll(
    businessId: string,
    options: { search?: string; page: number; limit: number; isVip?: boolean },
  ) {
    const where: any = { businessId, deletedAt: null };

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.isVip) {
      where.isVip = true;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { appointments: true, conversations: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      customers,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 10,
          orderBy: { startTime: 'desc' },
          include: {
            service: { select: { name: true } },
            employee: { select: { name: true } },
          },
        },
        conversations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { messages: true } } },
        },
        _count: {
          select: { appointments: true, conversations: true, leads: true },
        },
      },
    });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async getAppointments(customerId: string) {
    return this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { startTime: 'desc' },
      include: {
        service: { select: { name: true } },
        employee: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });
  }

  async getConversations(customerId: string) {
    return this.prisma.conversation.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async getInsights(customerId: string) {
    const customer = await this.findById(customerId);

    const appointments = await this.prisma.appointment.findMany({
      where: { customerId, status: 'COMPLETED' },
      orderBy: { startTime: 'desc' },
    });

    const totalVisits = appointments.length;
    const totalSpent = appointments.reduce((sum, a) => sum + Number(a.price || 0), 0);
    const lastVisit = appointments[0]?.startTime;
    const daysSinceLastVisit = lastVisit
      ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const favoriteService = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: { customerId, status: 'COMPLETED', serviceId: { not: null } },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 1,
    });

    return {
      customerId: customer.id,
      customerName: customer.name,
      totalVisits,
      totalSpent,
      averageSpend: totalVisits > 0 ? totalSpent / totalVisits : 0,
      daysSinceLastVisit,
      lastVisit,
      preferredEmployeeId: customer.preferredEmployeeId,
      loyaltyPoints: customer.loyaltyPoints,
      tags: customer.tags,
      isVip: customer.isVip,
      favoriteServiceId: favoriteService[0]?.serviceId || null,
    };
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async findOrCreate(dto: { phone?: string; email?: string; name?: string; businessId: string }) {
    if (!dto.phone && !dto.email) {
      throw new Error('Phone or email is required');
    }

    const where: any[] = [];
    if (dto.phone) where.push({ phone: dto.phone, businessId: dto.businessId });
    if (dto.email) where.push({ email: dto.email, businessId: dto.businessId });

    let customer = await this.prisma.customer.findFirst({
      where: { OR: where },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          businessId: dto.businessId,
          name: dto.name || 'Unknown',
          phone: dto.phone,
          email: dto.email,
        },
      });
    }

    return customer;
  }
}

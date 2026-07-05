import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getRevenue(businessId: string, startDate: Date, endDate: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        startTime: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      select: { price: true, startTime: true, service: { select: { price: true } } },
    });

    const total = appointments.reduce((sum, a) => sum + Number(a.price || a.service?.price || 0), 0);

    const daily = new Map<string, number>();
    for (const apt of appointments) {
      const day = apt.startTime.toISOString().split('T')[0];
      const aptPrice = Number(apt.price || apt.service?.price || 0);
      daily.set(day, (daily.get(day) || 0) + aptPrice);
    }

    return {
      total,
      count: appointments.length,
      average: appointments.length > 0 ? total / appointments.length : 0,
      dailyBreakdown: Object.fromEntries(daily),
    };
  }

  async getPopularServices(businessId: string, startDate: Date, endDate: Date) {
    const appointments = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        businessId,
        status: 'COMPLETED',
        serviceId: { not: null },
        startTime: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 10,
    });

    return appointments;
  }

  async getEmployeePerformance(businessId: string, startDate: Date, endDate: Date) {
    const employees = await this.prisma.appointment.groupBy({
      by: ['employeeId'],
      where: {
        businessId,
        status: 'COMPLETED',
        employeeId: { not: null },
        startTime: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return employees;
  }
}

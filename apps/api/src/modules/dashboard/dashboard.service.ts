import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTodaySummary(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayAppointments,
      todayNewLeads,
      totalCustomers,
      totalAppointments,
      recentConversations,
    ] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          businessId,
          startTime: { gte: today, lt: tomorrow },
          deletedAt: null,
        },
        orderBy: { startTime: 'asc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          employee: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
      }),
      this.prisma.lead.count({
        where: { businessId, createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.customer.count({ where: { businessId, deletedAt: null } }),
      this.prisma.appointment.count({ where: { businessId, deletedAt: null } }),
      this.prisma.conversation.findMany({
        where: { businessId, createdAt: { gte: today, lt: tomorrow } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    return {
      date: today.toISOString().split('T')[0],
      appointments: {
        total: todayAppointments.length,
        confirmed: todayAppointments.filter((a) => a.status === 'CONFIRMED').length,
        completed: todayAppointments.filter((a) => a.status === 'COMPLETED').length,
        cancelled: todayAppointments.filter((a) => a.status === 'CANCELLED').length,
        list: todayAppointments,
      },
      leads: { today: todayNewLeads },
      customers: { total: totalCustomers },
      appointmentsTotal: totalAppointments,
      recentConversations,
    };
  }

  async getStats(businessId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      appointments,
      revenue,
      customers,
      leads,
    ] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          businessId,
          startTime: { gte: start, lte: end },
          deletedAt: null,
        },
      }),
      this.prisma.appointment.aggregate({
        where: {
          businessId,
          startTime: { gte: start, lte: end },
          status: 'COMPLETED',
          deletedAt: null,
        },
        _sum: { price: true },
      }),
      this.prisma.customer.count({
        where: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
      }),
      this.prisma.lead.count({
        where: { businessId, createdAt: { gte: start, lte: end } },
      }),
    ]);

    const statusBreakdown = {
      PENDING: appointments.filter((a) => a.status === 'PENDING').length,
      CONFIRMED: appointments.filter((a) => a.status === 'CONFIRMED').length,
      COMPLETED: appointments.filter((a) => a.status === 'COMPLETED').length,
      CANCELLED: appointments.filter((a) => a.status === 'CANCELLED').length,
      NO_SHOW: appointments.filter((a) => a.status === 'NO_SHOW').length,
    };

    return {
      period: { start, end },
      appointments: {
        total: appointments.length,
        statusBreakdown,
      },
      revenue: {
        total: revenue._sum.price || 0,
      },
      customers: { new: customers },
      leads: { total: leads },
    };
  }

  async getLeadOverview(businessId: string) {
    const leads = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { id: true },
    });

    const sourceBreakdown = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { businessId },
      _count: { id: true },
    });

    return {
      byStatus: leads,
      bySource: sourceBreakdown,
    };
  }

  async getUpcomingAppointments(businessId: string, limit: number = 10) {
    return this.prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: new Date() },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        deletedAt: null,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true, color: true } },
        service: { select: { id: true, name: true, duration: true } },
      },
    });
  }
}

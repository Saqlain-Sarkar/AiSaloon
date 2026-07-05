import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppointmentToolService {
  private readonly logger = new Logger(AppointmentToolService.name);

  constructor(private prisma: PrismaService) {}

  async findAvailableSlots(params: {
    businessId: string;
    branchId: string;
    date: string;
    serviceId?: string;
    employeeId?: string;
  }) {
    const dayOfWeek = this.getDayOfWeek(new Date(params.date)) as any;

    const workingHours = await this.prisma.workingHour.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId: params.branchId,
          dayOfWeek,
        },
      },
    });

    if (!workingHours || workingHours.isClosed) {
      return { available: false, reason: 'Closed on this day', slots: [] };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId: params.branchId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        startTime: {
          gte: new Date(`${params.date}T00:00:00Z`),
          lte: new Date(`${params.date}T23:59:59Z`),
        },
      },
    });

    const [openHour, openMin] = workingHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = workingHours.closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    const slots: string[] = [];
    for (let m = openMinutes; m + 60 <= closeMinutes; m += 30) {
      const h = String(Math.floor(m / 60)).padStart(2, '0');
      const min = String(m % 60).padStart(2, '0');
      slots.push(`${h}:${min}`);
    }

    return {
      available: true,
      date: params.date,
      hours: `${workingHours.openTime} - ${workingHours.closeTime}`,
      slots,
    };
  }

  async createAppointment(params: {
    businessId: string;
    branchId: string;
    customerId: string;
    employeeId?: string;
    serviceId?: string;
    startTime: string;
    duration: number;
  }) {
    const startTime = new Date(params.startTime);
    const endTime = new Date(startTime.getTime() + params.duration * 60000);

    return this.prisma.appointment.create({
      data: {
        businessId: params.businessId,
        branchId: params.branchId || (await this.getDefaultBranch(params.businessId)).id,
        customerId: params.customerId,
        employeeId: params.employeeId,
        serviceId: params.serviceId,
        startTime,
        endTime,
        duration: params.duration,
        source: 'AI_CHAT',
        status: 'CONFIRMED',
      },
    });
  }

  private async getDefaultBranch(businessId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { businessId, isActive: true },
    });
    if (!branch) {
      return this.prisma.branch.create({
        data: {
          businessId,
          name: 'Main Branch',
        },
      });
    }
    return branch;
  }

  private getDayOfWeek(date: Date) {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getUTCDay()];
  }
}

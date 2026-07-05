import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DayOfWeek } from '@prisma/client';

interface SlotRequest {
  businessId: string;
  branchId: string;
  date: Date;
  serviceId?: string;
  employeeId?: string;
  duration?: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  employeeId?: string;
  employeeName?: string;
}

@Injectable()
export class AppointmentEngine {
  private readonly logger = new Logger(AppointmentEngine.name);
  private readonly DEFAULT_BUFFER_MINUTES = 15;
  private readonly SLOT_INTERVAL_MINUTES = 30;

  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(request: SlotRequest): Promise<{
    date: string;
    slots: TimeSlot[];
    availableEmployees: { id: string; name: string; title: string }[];
  }> {
    const dayOfWeek = this.getDayOfWeek(request.date);
    const dateStr = request.date.toISOString().split('T')[0];

    const workingHours = await this.prisma.workingHour.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId: request.branchId,
          dayOfWeek,
        },
      },
    });

    if (!workingHours || workingHours.isClosed) {
      return { date: dateStr, slots: [], availableEmployees: [] };
    }

    const isHoliday = await this.prisma.holiday.findFirst({
      where: {
        branchId: request.branchId,
        date: request.date,
      },
    });

    if (isHoliday) {
      return { date: dateStr, slots: [], availableEmployees: [] };
    }

    let duration = request.duration || 60;

    if (request.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: request.serviceId },
      });
      if (service) {
        duration = service.duration;
      }
    }

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        branchId: request.branchId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        startTime: {
          gte: new Date(`${dateStr}T00:00:00Z`),
          lte: new Date(`${dateStr}T23:59:59Z`),
        },
      },
      include: { employee: true },
    });

    let employees = await this.prisma.employee.findMany({
      where: {
        businessId: request.businessId,
        branchId: request.branchId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (request.employeeId) {
      employees = employees.filter((e) => e.id === request.employeeId);
    }

    if (request.serviceId) {
      const employeeIdsWithService = await this.prisma.employeeService.findMany({
        where: { serviceId: request.serviceId },
        select: { employeeId: true },
      });
      const validIds = new Set(employeeIdsWithService.map((e) => e.employeeId));
      employees = employees.filter((e) => validIds.has(e.id));
    }

    const slots: TimeSlot[] = [];
    const [openHour, openMin] = workingHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = workingHours.closeTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    for (let minutes = openMinutes; minutes + duration <= closeMinutes; minutes += this.SLOT_INTERVAL_MINUTES) {
      const slotStart = new Date(`${dateStr}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00Z`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      const now = new Date();
      if (slotStart <= now) continue;

      const availableEmployee = employees.find((emp) => {
        const hasConflict = existingAppointments.some((apt) => {
          if (apt.employeeId !== emp.id) return false;
          if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return false;
          return apt.startTime < slotEnd && apt.endTime > slotStart;
        });
        return !hasConflict;
      });

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: !!availableEmployee,
        employeeId: availableEmployee?.id,
        employeeName: availableEmployee?.name,
      });
    }

    return {
      date: dateStr,
      slots,
      availableEmployees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title || 'Staff',
      })),
    };
  }

  async validateSlot(
    businessId: string,
    branchId: string,
    startTime: Date,
    endTime: Date,
    employeeId?: string,
  ): Promise<{ available: boolean; reason?: string }> {
    const dayOfWeek = this.getDayOfWeek(startTime);

    const workingHours = await this.prisma.workingHour.findUnique({
      where: { branchId_dayOfWeek: { branchId, dayOfWeek } },
    });

    if (!workingHours || workingHours.isClosed) {
      return { available: false, reason: 'Branch is closed on this day' };
    }

    const [openHour, openMin] = workingHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = workingHours.closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      return { available: false, reason: 'Outside working hours' };
    }

    const isHoliday = await this.prisma.holiday.findFirst({
      where: { branchId, date: startTime },
    });

    if (isHoliday) {
      return { available: false, reason: `Branch is closed for ${isHoliday.name}` };
    }

    if (employeeId) {
      const conflicting = await this.prisma.appointment.findFirst({
        where: {
          employeeId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (conflicting) {
        return { available: false, reason: 'Employee has a conflicting appointment' };
      }
    }

    return { available: true };
  }

  async getAvailableEmployees(
    businessId: string,
    branchId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
  ) {
    const employees = await this.prisma.employee.findMany({
      where: {
        businessId,
        branchId,
        isActive: true,
        deletedAt: null,
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { employeeId: true },
    });

    const busyEmployeeIds = new Set(appointments.map((a) => a.employeeId));

    return employees
      .filter((e) => !busyEmployeeIds.has(e.id))
      .map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title,
      }));
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
      'THURSDAY', 'FRIDAY', 'SATURDAY',
    ];
    return days[date.getDay()];
  }
}

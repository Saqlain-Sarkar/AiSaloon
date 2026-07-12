import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto, RescheduleAppointmentDto, CancelAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentEngine } from './appointment-engine.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private appointmentEngine: AppointmentEngine,
  ) {}

  async create(businessId: string, dto: CreateAppointmentDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + dto.duration * 60000);

    let assignedEmployeeId = dto.employeeId;

    if (!assignedEmployeeId) {
      // Auto-assign first available employee
      const availableEmployees = await this.appointmentEngine.getAvailableEmployees(
        businessId,
        dto.branchId,
        startTime, // Date doesn't strictly matter for the query format inside getAvailableEmployees since it checks by startTime/endTime
        startTime,
        endTime
      );
      if (availableEmployees.length > 0) {
        assignedEmployeeId = availableEmployees[0].id;
      } else {
        throw new BadRequestException('No staff members are available for this time slot');
      }
    }

    const isValid = await this.appointmentEngine.validateSlot(
      businessId,
      dto.branchId,
      startTime,
      endTime,
      assignedEmployeeId,
    );

    if (!isValid.available) {
      throw new BadRequestException(isValid.reason || 'Time slot is not available');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        businessId,
        branchId: dto.branchId,
        customerId: dto.customerId,
        employeeId: assignedEmployeeId,
        serviceId: dto.serviceId,
        startTime,
        endTime,
        duration: dto.duration,
        source: dto.source || 'AI_CHAT',
        notes: dto.notes,
        isWalkIn: dto.isWalkIn || false,
        status: 'CONFIRMED',
      },
      include: {
        customer: true,
        employee: true,
        service: true,
      },
    });

    return appointment;
  }

  async findAll(
    businessId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      employeeId?: string;
      customerId?: string;
      status?: string;
    },
  ) {
    const where: any = { businessId, deletedAt: null };

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) where.startTime.gte = new Date(filters.startDate);
      if (filters.endDate) where.startTime.lte = new Date(filters.endDate);
    }
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;

    return this.prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, photo: true } },
        employee: { select: { id: true, name: true, title: true, color: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        employee: true,
        service: true,
        branch: true,
        conversation: {
          include: { messages: { take: 10, orderBy: { createdAt: 'desc' } } },
        },
      },
    });

    if (!appointment || appointment.deletedAt) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.findById(id);
    const newStart = new Date(dto.startTime);
    const newEnd = new Date(newStart.getTime() + appointment.duration * 60000);

    const isValid = await this.appointmentEngine.validateSlot(
      appointment.businessId,
      appointment.branchId,
      newStart,
      newEnd,
      dto.employeeId || appointment.employeeId || undefined,
    );

    if (!isValid.available) {
      throw new BadRequestException(isValid.reason || 'New time slot is not available');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        startTime: newStart,
        endTime: newEnd,
        employeeId: dto.employeeId || appointment.employeeId,
        rescheduleCount: { increment: 1 },
        status: 'CONFIRMED',
      },
      include: {
        customer: true,
        employee: true,
        service: true,
      },
    });
  }

  async cancel(id: string, dto: CancelAppointmentDto) {
    await this.findById(id);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: dto.reason,
      },
    });
  }

  async updateStatus(id: string, status: string, paymentStatus?: string, paymentMethod?: string) {
    const appointment = await this.findById(id);

    if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    
    const data: any = { status: status as AppointmentStatus };
    
    // If completing the appointment, we can set payment details and assign the service price if not already set
    if (status === 'COMPLETED') {
      if (paymentStatus) data.paymentStatus = paymentStatus;
      if (paymentMethod) data.paymentMethod = paymentMethod;
      if (!appointment.price && appointment.service) {
        data.price = appointment.service.price;
      }
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }
}

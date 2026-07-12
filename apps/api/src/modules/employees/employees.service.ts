import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: any) {
    return this.prisma.employee.create({
      data: {
        businessId,
        branchId: dto.branchId,
        userId: dto.userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        title: dto.title,
        bio: dto.bio,
        gender: dto.gender,
        color: dto.color,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async findAll(businessId: string, branchId?: string) {
    const where: any = { businessId, deletedAt: null };
    if (branchId) where.branchId = branchId;
    return this.prisma.employee.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          include: { service: true },
        },
      },
    });
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        serviceAvailabilities: true,
      },
    });
    if (!employee || employee.deletedAt) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignServices(employeeId: string, serviceIds: string[]) {
    await this.findById(employeeId);

    await this.prisma.employeeService.deleteMany({ where: { employeeId } });

    if (serviceIds.length > 0) {
      await this.prisma.employeeService.createMany({
        data: serviceIds.map((serviceId, index) => ({
          employeeId,
          serviceId,
          isPrimary: index === 0,
        })),
      });
    }

    return this.findById(employeeId);
  }

  async getBusinessAnalytics(businessId: string, startDate?: string, endDate?: string) {
    const where: any = { businessId, deletedAt: null };
    const employees = await this.prisma.employee.findMany({ where, orderBy: { sortOrder: 'asc' } });

    const results = await Promise.all(
      employees.map((emp) => this.getSingleEmployeeAnalytics(emp.id, businessId, startDate, endDate))
    );

    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getSingleEmployeeAnalytics(employeeId: string, businessId: string, startDate?: string, endDate?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });

    const dateFilter: any = { status: { notIn: ['CANCELLED', 'NO_SHOW'] } };
    if (startDate || endDate) {
      dateFilter.startTime = {};
      if (startDate) dateFilter.startTime.gte = new Date(startDate);
      if (endDate) dateFilter.startTime.lte = new Date(endDate);
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { employeeId, businessId, ...dateFilter },
      include: {
        service: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');
    const totalRevenue = completedAppointments
      .filter((a) => a.paymentStatus === 'PAID')
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
    const totalCustomers = new Set(appointments.map((a) => a.customerId)).size;
    const avgBookingValue = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

    // Service frequency map
    const serviceMap: Record<string, { name: string; count: number }> = {};
    for (const apt of appointments) {
      if (apt.service) {
        if (!serviceMap[apt.service.id]) serviceMap[apt.service.id] = { name: apt.service.name, count: 0 };
        serviceMap[apt.service.id].count += 1;
      }
    }
    const popularServices = Object.values(serviceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Status breakdown
    const statusBreakdown = {
      COMPLETED: appointments.filter((a) => a.status === 'COMPLETED').length,
      CONFIRMED: appointments.filter((a) => a.status === 'CONFIRMED').length,
      PENDING: appointments.filter((a) => a.status === 'PENDING').length,
      CANCELLED: appointments.filter((a) => a.status === 'CANCELLED').length,
      NO_SHOW: appointments.filter((a) => a.status === 'NO_SHOW').length,
    };

    return {
      employee: {
        id: employee?.id,
        name: employee?.name,
        title: employee?.title,
        color: employee?.color,
        photo: employee?.photo,
        isActive: employee?.isActive,
      },
      totalAppointments,
      completedAppointments: completedAppointments.length,
      totalRevenue,
      totalCustomers,
      avgBookingValue,
      popularServices,
      statusBreakdown,
    };
  }
}

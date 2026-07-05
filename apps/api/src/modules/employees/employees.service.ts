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
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: any) {
    return this.prisma.branch.create({
      data: {
        businessId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        phone: dto.phone,
        email: dto.email,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.branch.findMany({
      where: { businessId, deletedAt: null },
      include: { workingHours: true, holidays: true },
    });
  }

  async findById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        workingHours: true,
        holidays: true,
        employees: { where: { isActive: true } },
        _count: { select: { appointments: true, customers: true } },
      },
    });
    if (!branch || branch.deletedAt) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async setWorkingHours(branchId: string, dto: { dayOfWeek: string; openTime: string; closeTime: string; isClosed?: boolean }) {
    return this.prisma.workingHour.upsert({
      where: { branchId_dayOfWeek: { branchId, dayOfWeek: dto.dayOfWeek as any } },
      update: { openTime: dto.openTime, closeTime: dto.closeTime, isClosed: dto.isClosed || false },
      create: {
        branchId,
        dayOfWeek: dto.dayOfWeek as any,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        isClosed: dto.isClosed || false,
      },
    });
  }

  async addHoliday(branchId: string, dto: { name: string; date: string; isRecurring?: boolean }) {
    return this.prisma.holiday.create({
      data: {
        branchId,
        name: dto.name,
        date: new Date(dto.date),
        isRecurring: dto.isRecurring || false,
      },
    });
  }
}

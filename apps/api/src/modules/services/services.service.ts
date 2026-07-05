import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: any) {
    return this.prisma.service.create({
      data: {
        businessId,
        branchId: dto.branchId,
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,
        discountedPrice: dto.discountedPrice,
        categoryId: dto.categoryId,
        color: dto.color,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId, deletedAt: null },
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.deletedAt) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

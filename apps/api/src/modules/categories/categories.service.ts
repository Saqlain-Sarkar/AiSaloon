import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: CreateCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: {
        businessId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!category || category.deletedAt) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    await this.findById(id);
    return this.prisma.serviceCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.serviceCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

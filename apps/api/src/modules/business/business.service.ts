import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto) {
    const existingSlug = await this.prisma.business.findUnique({
      where: { slug: createBusinessDto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug is already taken');
    }

    return this.prisma.business.create({
      data: createBusinessDto,
    });
  }

  async findAll() {
    return this.prisma.business.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        branches: true,
      },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    await this.findOne(id); // Check existence

    if (updateBusinessDto.slug) {
      const existingSlug = await this.prisma.business.findFirst({
        where: { slug: updateBusinessDto.slug, id: { not: id } },
      });

      if (existingSlug) {
        throw new ConflictException('Slug is already taken by another business');
      }
    }

    return this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence

    await this.prisma.business.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Business deleted successfully' };
  }
}

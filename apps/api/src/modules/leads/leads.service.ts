import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        businessId,
        ...dto,
      },
    });
  }

  async findAll(
    businessId: string,
    options: { status?: string; source?: string; page: number; limit: number },
  ) {
    const where: any = { businessId };

    if (options.status) where.status = options.status;
    if (options.source) where.source = options.source;

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async findById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findById(id);
    return this.prisma.lead.update({
      where: { id },
      data: dto as any,
    });
  }
}

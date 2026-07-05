import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getBusinessKnowledge(businessId: string) {
    const [business, services, employees, settings] = await Promise.all([
      this.prisma.business.findUnique({ where: { id: businessId } }),
      this.prisma.service.findMany({
        where: { businessId, isActive: true, deletedAt: null },
      }),
      this.prisma.employee.findMany({
        where: { businessId, isActive: true, deletedAt: null },
      }),
      this.prisma.setting.findUnique({ where: { businessId } }),
    ]);

    return {
      business: {
        name: business?.name,
        about: business?.about,
        email: business?.email,
        phone: business?.phone,
        website: business?.website,
        timezone: business?.timezone,
        currency: business?.currency,
      },
      services: services.map((s) => ({
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        discountedPrice: s.discountedPrice ? Number(s.discountedPrice) : null,
        categoryId: s.categoryId,
      })),
      employees: employees.map((e) => ({
        name: e.name,
        title: e.title,
      })),
      settings: settings?.aiConfig || {},
    };
  }

  async searchKnowledge(businessId: string, query: string): Promise<string> {
    const knowledge = await this.getBusinessKnowledge(businessId);
    const query_lower = query.toLowerCase();

    if (query_lower.includes('price') || query_lower.includes('cost') || query_lower.includes('fee') || query_lower.includes('₹') || query_lower.includes('rs')) {
      return knowledge.services
        .map((s) => `${s.name}: ${s.discountedPrice ? `Rs.${s.discountedPrice} (was Rs.${s.price})` : `Rs.${s.price}`} | ${s.duration} min`)
        .join('\n');
    }

    if (query_lower.includes('timing') || query_lower.includes('hour') || query_lower.includes('open') || query_lower.includes('close')) {
      return `${knowledge.business.name} is open. Services are available during business hours.`;
    }

    if (query_lower.includes('service') || query_lower.includes('offer') || query_lower.includes('treat')) {
      return knowledge.services
        .map((s) => `${s.name}${s.description ? ` - ${s.description}` : ''} (${s.duration} min, Rs.${s.price})`)
        .join('\n');
    }

    if (query_lower.includes('staff') || query_lower.includes('stylist') || query_lower.includes('employee') || query_lower.includes('who')) {
      return knowledge.employees
        .map((e) => `${e.name}${e.title ? ` - ${e.title}` : ''}`)
        .join('\n');
    }

    return JSON.stringify(knowledge);
  }
}

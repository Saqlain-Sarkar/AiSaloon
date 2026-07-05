import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getDefaultBusinessId(): Promise<string> {
    const business = await this.prisma.business.findFirst();
    if (!business) {
      // Create a default one if none exists in dev
      const newBiz = await this.prisma.business.create({
        data: { name: 'Demo Salon', slug: 'demo-salon-' + Date.now() }
      });
      return newBiz.id;
    }
    return business.id;
  }

  async get(businessId: string) {
    let settings = await this.prisma.setting.findUnique({ where: { businessId } });
    if (!settings) {
      settings = await this.prisma.setting.create({
        data: {
          businessId,
          businessName: '',
          businessHours: {},
          aiConfig: {},
          notificationConfig: {},
          generalConfig: {},
        },
      });
    }
    return settings;
  }

  async update(businessId: string, dto: any) {
    return this.prisma.setting.update({
      where: { businessId },
      data: {
        businessName: dto.businessName,
        businessHours: dto.businessHours,
        notificationConfig: dto.notificationConfig,
        generalConfig: dto.generalConfig,
      },
    });
  }

  async getAiConfig(businessId: string) {
    const settings = await this.get(businessId);
    return (settings.aiConfig as any) || {};
  }

  async updateAiConfig(businessId: string, dto: any) {
    const settings = await this.get(businessId);
    const currentConfig = (settings.aiConfig as any) || {};
    return this.prisma.setting.update({
      where: { businessId },
      data: {
        aiConfig: { ...currentConfig, ...dto },
      },
    });
  }
}

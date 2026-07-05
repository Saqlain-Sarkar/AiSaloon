import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuperadminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalBusinesses, totalUsers, totalAppointments] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.user.count(),
      this.prisma.appointment.count(),
    ]);

    return {
      totalBusinesses,
      totalUsers,
      totalAppointments,
    };
  }

  async getBusinesses() {
    return this.prisma.business.findMany({
      include: {
        users: {
          where: { role: 'BUSINESS_OWNER' },
          select: { email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async toggleBusinessStatus(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return this.prisma.business.update({
      where: { id },
      data: { isActive: !business.isActive }
    });
  }
}

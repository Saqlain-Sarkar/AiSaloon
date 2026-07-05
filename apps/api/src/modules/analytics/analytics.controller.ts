import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';

import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService
  ) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenue(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.analyticsService.getRevenue(
      bizId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('popular-services')
  @ApiOperation({ summary: 'Get most booked services' })
  async getPopularServices(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.analyticsService.getPopularServices(
      bizId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('employee-performance')
  @ApiOperation({ summary: 'Get employee performance metrics' })
  async getEmployeePerformance(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.analyticsService.getEmployeePerformance(
      bizId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}

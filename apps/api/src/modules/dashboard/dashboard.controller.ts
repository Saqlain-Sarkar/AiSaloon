import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s dashboard summary' })
  async getTodaySummary(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getTodaySummary(user.businessId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getStats(user.businessId, startDate, endDate);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Get lead overview' })
  async getLeadOverview(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getLeadOverview(user.businessId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments' })
  async getUpcomingAppointments(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string) {
    return this.dashboardService.getUpcomingAppointments(user.businessId, limit ? parseInt(limit) : 10);
  }
}

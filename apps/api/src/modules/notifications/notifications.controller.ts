import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.create(user.businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.notificationsService.findAll(user.businessId, { customerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  async findById(@Param('id') id: string) {
    return this.notificationsService.findById(id);
  }
}

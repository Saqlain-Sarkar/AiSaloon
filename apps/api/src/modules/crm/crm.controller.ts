import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.crmService.create(user.businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customers with search and filters' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isVip') isVip?: string,
  ) {
    return this.crmService.findAll(user.businessId, {
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      isVip: isVip === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID with full profile' })
  async findById(@Param('id') id: string) {
    return this.crmService.findById(id);
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get customer appointment history' })
  async getAppointments(@Param('id') id: string) {
    return this.crmService.getAppointments(id);
  }

  @Get(':id/conversations')
  @ApiOperation({ summary: 'Get customer conversation history' })
  async getConversations(@Param('id') id: string) {
    return this.crmService.getConversations(id);
  }

  @Get(':id/insights')
  @ApiOperation({ summary: 'Get customer insights and analytics' })
  async getInsights(@Param('id') id: string) {
    return this.crmService.getInsights(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer profile' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.crmService.update(id, dto);
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Find or create customer by phone/email' })
  async findOrCreate(@Body() dto: { phone?: string; email?: string; name?: string; businessId: string }) {
    return this.crmService.findOrCreate(dto);
  }
}

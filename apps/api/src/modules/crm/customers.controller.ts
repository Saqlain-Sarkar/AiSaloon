import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService, private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: JwtPayload) {
    return this.customersService.create(user.businessId, dto);
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
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.customersService.findAll(bizId, {
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      isVip: isVip === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID with full profile' })
  async findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get customer appointment history' })
  async getAppointments(@Param('id') id: string) {
    return this.customersService.getAppointments(id);
  }

  @Get(':id/conversations')
  @ApiOperation({ summary: 'Get customer conversation history' })
  async getConversations(@Param('id') id: string) {
    return this.customersService.getConversations(id);
  }

  @Get(':id/insights')
  @ApiOperation({ summary: 'Get customer insights and analytics' })
  async getInsights(@Param('id') id: string) {
    return this.customersService.getInsights(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer profile' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Find or create customer by phone/email' })
  async findOrCreate(@Body() dto: { phone?: string; email?: string; name?: string; businessId?: string }) {
    let bizId = dto.businessId;
    if (!bizId) {
      const biz = await this.prisma.business.findFirst();
      bizId = biz?.id || '';
    }
    console.log('[API POST /customers/lookup] Request Payload:', { dto, bizId });
    try {
      const result = await this.customersService.findOrCreate({ ...dto, businessId: bizId });
      console.log('[API POST /customers/lookup] Success:', result.id);
      return result;
    } catch (error: any) {
      console.error('[API POST /customers/lookup] Error:', error.message || error);
      throw error;
    }
  }
}

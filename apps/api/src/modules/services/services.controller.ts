import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService, private readonly prisma: PrismaService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a service' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.servicesService.create(bizId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all services for a business' })
  async findAll(@CurrentUser() user: JwtPayload) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.servicesService.findAll(bizId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  async findById(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a service' })
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}

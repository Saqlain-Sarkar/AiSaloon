import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards';

import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Employees')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an employee' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.employeesService.create(bizId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List employees for the business' })
  async findAll(@CurrentUser() user: JwtPayload, @Query('branchId') branchId?: string) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.employeesService.findAll(bizId, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete employee' })
  async remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Post(':id/services')
  @ApiOperation({ summary: 'Assign services to employee' })
  async assignServices(@Param('id') id: string, @Body() dto: { serviceIds: string[] }) {
    return this.employeesService.assignServices(id, dto.serviceIds);
  }
}

import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a branch' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.branchesService.create(user.businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all branches' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.branchesService.findAll(user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  async findById(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.branchesService.update(id, dto);
  }

  @Post(':id/working-hours')
  @ApiOperation({ summary: 'Set working hours' })
  async setWorkingHours(@Param('id') id: string, @Body() dto: any) {
    if (Array.isArray(dto)) {
      return this.branchesService.setWorkingHoursBatch(id, dto);
    }
    return this.branchesService.setWorkingHours(id, dto);
  }

  @Post(':id/holidays')
  @ApiOperation({ summary: 'Add a holiday' })
  async addHoliday(@Param('id') id: string, @Body() dto: any) {
    return this.branchesService.addHoliday(id, dto);
  }
}

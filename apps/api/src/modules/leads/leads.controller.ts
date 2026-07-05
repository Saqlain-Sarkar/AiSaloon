import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a lead' })
  async create(@Body() dto: CreateLeadDto, @CurrentUser() user: JwtPayload) {
    return this.leadsService.create(user.businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with filters' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leadsService.findAll(user.businessId, {
      status,
      source,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async findById(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead status' })
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }
}

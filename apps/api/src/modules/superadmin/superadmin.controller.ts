import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperadminService } from './superadmin.service';
import { Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Superadmin')
@ApiBearerAuth()
@Controller('superadmin')
@Roles(UserRole.SUPER_ADMIN)
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get global stats across all tenants' })
  getStats() {
    return this.superadminService.getStats();
  }

  @Get('businesses')
  @ApiOperation({ summary: 'List all businesses (tenants)' })
  getBusinesses() {
    return this.superadminService.getBusinesses();
  }

  @Patch('businesses/:id/status')
  @ApiOperation({ summary: 'Toggle active status of a business' })
  toggleStatus(@Param('id') id: string) {
    return this.superadminService.toggleBusinessStatus(id);
  }
}

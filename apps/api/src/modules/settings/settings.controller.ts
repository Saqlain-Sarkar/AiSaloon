import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get business settings' })
  async get(@CurrentUser() user: JwtPayload) {
    const businessId = user?.businessId || await this.settingsService.getDefaultBusinessId();
    return this.settingsService.get(businessId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update business settings' })
  async update(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    const businessId = user?.businessId || await this.settingsService.getDefaultBusinessId();
    return this.settingsService.update(businessId, dto);
  }

  @Get('ai')
  @ApiOperation({ summary: 'Get AI configuration' })
  async getAiConfig(@CurrentUser() user: JwtPayload) {
    const businessId = user?.businessId || await this.settingsService.getDefaultBusinessId();
    return this.settingsService.getAiConfig(businessId);
  }

  @Patch('ai')
  @ApiOperation({ summary: 'Update AI configuration' })
  async updateAiConfig(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    const businessId = user?.businessId || await this.settingsService.getDefaultBusinessId();
    return this.settingsService.updateAiConfig(businessId, dto);
  }
}

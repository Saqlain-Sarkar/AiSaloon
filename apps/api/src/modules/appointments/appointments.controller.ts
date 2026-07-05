import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AppointmentEngine } from './appointment-engine.service';
import { CreateAppointmentDto, RescheduleAppointmentDto, CancelAppointmentDto } from './dto/create-appointment.dto';
import { CurrentUser, Public } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards';

import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentEngine: AppointmentEngine,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an appointment' })
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    console.log('[API POST /appointments] Request Payload:', { businessId: bizId, dto });
    try {
      const result = await this.appointmentsService.create(bizId, dto);
      console.log('[API POST /appointments] Success:', result.id);
      return result;
    } catch (error: any) {
      console.error('[API POST /appointments] Error:', error.message || error);
      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List appointments with filters' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('employeeId') employeeId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.appointmentsService.findAll(bizId, {
      startDate,
      endDate,
      employeeId,
      customerId,
      status,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment by ID' })
  async findById(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id/reschedule')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reschedule an appointment' })
  async reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(id, dto);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an appointment' })
  async cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel(id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment status and optionally payment' })
  async updateStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Body('paymentStatus') paymentStatus?: string,
    @Body('paymentMethod') paymentMethod?: string
  ) {
    return this.appointmentsService.updateStatus(id, status, paymentStatus, paymentMethod);
  }

  // ─── Engine Endpoints ─────────────────────────────────

  @Get('slots/available')
  @Public()
  @ApiOperation({ summary: 'Get available time slots' })
  async getAvailableSlots(
    @Query('businessId') businessId: string,
    @Query('branchId') branchId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('duration') duration?: string,
  ) {
    return this.appointmentEngine.getAvailableSlots({
      businessId,
      branchId,
      date: new Date(date),
      serviceId,
      employeeId,
      duration: duration ? parseInt(duration) : undefined,
    });
  }

  @Post('slots/validate')
  @ApiOperation({ summary: 'Validate if a time slot is available' })
  async validateSlot(
    @Body() dto: { businessId: string; branchId: string; startTime: string; endTime: string; employeeId?: string },
  ) {
    return this.appointmentEngine.validateSlot(
      dto.businessId,
      dto.branchId,
      new Date(dto.startTime),
      new Date(dto.endTime),
      dto.employeeId,
    );
  }

  @Get('slots/employees')
  @Public()
  @ApiOperation({ summary: 'Get available employees for a time slot' })
  async getAvailableEmployees(
    @Query('businessId') businessId: string,
    @Query('branchId') branchId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.appointmentEngine.getAvailableEmployees(
      businessId,
      branchId,
      new Date(date),
      new Date(startTime),
      new Date(endTime),
    );
  }
}

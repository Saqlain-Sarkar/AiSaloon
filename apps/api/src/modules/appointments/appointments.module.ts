import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEngine } from './appointment-engine.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentEngine],
  exports: [AppointmentsService, AppointmentEngine],
})
export class AppointmentsModule {}

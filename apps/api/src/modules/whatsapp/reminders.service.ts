import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  // Run every 15 minutes to check for upcoming appointments
  @Cron("*/15 * * * *")
  async handleUpcomingAppointments() {
    this.logger.log('Checking for upcoming appointments to send reminders...');
    
    // Find appointments that are starting in the next 3 hours and haven't had a reminder sent yet.
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    
    try {
      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          reminderSent: false,
          startTime: {
            gte: now,
            lte: threeHoursFromNow,
          }
        },
        include: {
          customer: true,
          service: true,
          business: true,
        }
      });

      if (upcomingAppointments.length === 0) {
        return;
      }

      this.logger.log(`Found ${upcomingAppointments.length} upcoming appointments needing reminders.`);

      for (const appointment of upcomingAppointments) {
        if (!appointment.customer.phone) continue;
        
        try {
          const serviceName = appointment.service?.name || 'appointment';
          const time = appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const businessName = appointment.business.name || 'our salon';
          
          const reminderMessage = `Hi ${appointment.customer.name},\n\nJust a friendly reminder about your upcoming ${serviceName} appointment at ${businessName} today at ${time}.\n\nSee you soon!`;
          
          await this.whatsappService.sendWhatsappMessage(
            appointment.businessId,
            appointment.customer.phone,
            reminderMessage
          );

          await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminderSent: true }
          });
          
          this.logger.log(`Reminder sent to ${appointment.customer.phone} for appointment ${appointment.id}`);
        } catch (err: any) {
          this.logger.error(`Failed to send reminder for appointment ${appointment.id}: ${err.message}`);
        }
      }
    } catch (error) {
      this.logger.error('Error in handleUpcomingAppointments cron job', error);
    }
  }
}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessModule } from './modules/business/business.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ServicesModule } from './modules/services/services.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { CrmModule } from './modules/crm/crm.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { LeadsModule } from './modules/leads/leads.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AiModule } from './ai/ai.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { RedisModule } from './common/redis';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { limit: 100, ttl: 60000 },
      ],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    BusinessModule,
    SuperadminModule,
    BranchesModule,
    ServicesModule,
    EmployeesModule,
    AppointmentsModule,
    CrmModule,
    ConversationsModule,
    LeadsModule,
    NotificationsModule,
    DashboardModule,
    AnalyticsModule,
    SettingsModule,
    PaymentsModule,
    InventoryModule,
    AiModule,
    WhatsappModule,
    CategoriesModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

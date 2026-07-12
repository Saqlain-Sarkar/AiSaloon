import { Module, forwardRef } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { AiModule } from '../../ai/ai.module';
import { CrmModule } from '../crm/crm.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [forwardRef(() => AiModule), CrmModule, AppointmentsModule, forwardRef(() => WhatsappModule)],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}

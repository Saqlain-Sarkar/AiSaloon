import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => ConversationsModule), PrismaModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}

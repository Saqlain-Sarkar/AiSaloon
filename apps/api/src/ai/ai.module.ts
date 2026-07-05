import { Module, forwardRef } from '@nestjs/common';
import { AiEngineService } from './engine/ai-engine.service';
import { IntentRegistryService } from './intents/intent-registry.service';
import { AppointmentToolService } from './tools/appointment-tool.service';
import { CustomerToolService } from './tools/customer-tool.service';
import { KnowledgeBaseService } from './knowledge/knowledge-base.service';
import { ConversationMemoryService } from './memory/conversation-memory.service';

@Module({
  providers: [
    AiEngineService,
    IntentRegistryService,
    AppointmentToolService,
    CustomerToolService,
    KnowledgeBaseService,
    ConversationMemoryService,
  ],
  exports: [
    AiEngineService,
    IntentRegistryService,
    AppointmentToolService,
    CustomerToolService,
    KnowledgeBaseService,
    ConversationMemoryService,
  ],
})
export class AiModule {}

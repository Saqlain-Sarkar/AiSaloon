import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ConversationContext {
  conversationId: string;
  customerId: string;
  businessId: string;
  currentIntent?: string;
  pendingAction?: string;
  extractedData: Record<string, any>;
  slotFilling: Record<string, any>;
  lastMessageAt: Date;
}

@Injectable()
export class ConversationMemoryService {
  private contexts: Map<string, ConversationContext> = new Map();

  constructor(private prisma: PrismaService) {}

  getOrCreateContext(conversationId: string, customerId: string, businessId: string): ConversationContext {
    const existing = this.contexts.get(conversationId);
    if (existing) {
      existing.lastMessageAt = new Date();
      return existing;
    }

    const context: ConversationContext = {
      conversationId,
      customerId,
      businessId,
      extractedData: {},
      slotFilling: {},
      lastMessageAt: new Date(),
    };

    this.contexts.set(conversationId, context);
    return context;
  }

  updateContext(conversationId: string, updates: Partial<ConversationContext>) {
    const context = this.contexts.get(conversationId);
    if (context) {
      Object.assign(context, updates);
      context.lastMessageAt = new Date();
    }
  }

  getContext(conversationId: string): ConversationContext | undefined {
    return this.contexts.get(conversationId);
  }

  clearContext(conversationId: string) {
    this.contexts.delete(conversationId);
  }

  cleanupOldContexts(maxAgeMinutes: number = 60) {
    const now = new Date();
    for (const [id, context] of this.contexts.entries()) {
      const ageMinutes = (now.getTime() - context.lastMessageAt.getTime()) / 60000;
      if (ageMinutes > maxAgeMinutes) {
        this.contexts.delete(id);
      }
    }
  }
}

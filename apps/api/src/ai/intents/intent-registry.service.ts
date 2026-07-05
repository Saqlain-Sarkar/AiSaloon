import { Injectable } from '@nestjs/common';

export interface IntentHandler {
  intent: string;
  confidence: number;
  handle(params: any): Promise<{ response: string; action?: any }>;
}

@Injectable()
export class IntentRegistryService {
  private handlers: Map<string, IntentHandler> = new Map();

  register(handler: IntentHandler) {
    this.handlers.set(handler.intent, handler);
  }

  getHandler(intent: string): IntentHandler | undefined {
    return this.handlers.get(intent);
  }

  getAllIntents(): string[] {
    return Array.from(this.handlers.keys());
  }
}

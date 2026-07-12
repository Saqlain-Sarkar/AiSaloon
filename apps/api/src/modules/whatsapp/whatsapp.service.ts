import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import { usePrismaAuthState } from './prisma-auth';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private clients: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private connectionStatus: Map<string, boolean> = new Map();
  private processedMessages: Set<string> = new Set();
  private retryCounts: Map<string, number> = new Map();

  constructor(
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing WhatsApp Service Manager (Baileys)...');
    try {
      const businesses = await this.prisma.business.findMany({ select: { id: true } });
      for (const b of businesses) {
        const sessions = await this.prisma.whatsAppSession.findFirst({
          where: { businessId: b.id }
        });
        if (sessions) {
          this.logger.log(`Auto-starting WhatsApp client for business: ${b.id}`);
          await this.initializeClient(b.id);
        }
      }
    } catch (e) {
      this.logger.error("Failed to auto-start existing clients", e);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down all WhatsApp Clients...');
    for (const [businessId, client] of this.clients.entries()) {
      client.logout(); // Stop client
    }
  }

  public async initializeClient(businessId: string): Promise<void> {
    if (this.clients.has(businessId)) {
      return; 
    }

    this.logger.log(`Starting new WhatsApp Client for business: ${businessId}`);
    
    const { state, saveCreds, clearState } = await usePrismaAuthState(this.prisma, businessId);

    const client = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any, 
      keepAliveIntervalMs: 30000,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
    });

    this.clients.set(businessId, client);
    this.connectionStatus.set(businessId, false);

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        this.qrCodes.set(businessId, qr);
        this.connectionStatus.set(businessId, false);
        this.logger.log(`[${businessId}] New QR Code generated. Scan to pair.`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isFatal = statusCode === 401 || statusCode === 403 || statusCode === 405;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !isFatal;
        this.logger.warn(`[${businessId}] Connection closed. Code: ${statusCode}. Fatal: ${isFatal}. Reconnecting: ${shouldReconnect}`);
        
        this.connectionStatus.set(businessId, false);
        this.clients.delete(businessId);
        this.qrCodes.delete(businessId);
        
        if (shouldReconnect) {
          const retries = this.retryCounts.get(businessId) || 0;
          if (retries >= 5) {
            this.logger.error(`[${businessId}] Too many reconnect attempts (${retries + 1}). Session might be corrupted or replaced. Force clearing session.`);
            await clearState();
            this.retryCounts.delete(businessId);
            return;
          }
          
          const delay = Math.min(5000 * Math.pow(1.5, retries), 60000); // Exponential backoff max 60s
          this.retryCounts.set(businessId, retries + 1);
          
          this.logger.log(`[${businessId}] Retrying connection in ${Math.round(delay)}ms (Attempt ${retries + 1})`);
          setTimeout(() => {
            this.initializeClient(businessId);
          }, delay);
        } else {
          this.logger.log(`[${businessId}] User logged out or fatal error. Cleaning up session.`);
          await clearState();
          this.retryCounts.delete(businessId);
        }
      } else if (connection === 'open') {
        this.logger.log(`[${businessId}] WhatsApp Client is Ready! AI is now connected.`);
        this.connectionStatus.set(businessId, true);
        this.qrCodes.delete(businessId); 
        this.retryCounts.delete(businessId);
      }
    });

    client.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;
      for (const msg of m.messages) {
        await this.handleIncomingMessage(businessId, client, msg);
      }
    });
  }

  private async handleIncomingMessage(businessId: string, client: any, msg: any) {
    try {
      if (!msg.message || msg.key.fromMe) return;
      
      const msgId = msg.key.id;
      if (msgId && this.processedMessages.has(msgId)) return;
      if (msgId) {
        this.processedMessages.add(msgId);
        // keep cache small
        if (this.processedMessages.size > 500) {
          const firstItem = this.processedMessages.values().next().value;
          if (firstItem) this.processedMessages.delete(firstItem);
        }
      }

      const senderId = msg.key.remoteJid;
      if (!senderId || senderId.endsWith('@g.us')) return; 

      // Extract text content from either standard or extended message types
      const content = msg.message.conversation || msg.message.extendedTextMessage?.text;
      if (!content) return;

      // Baileys MD JIDs look like "1234567890:44@s.whatsapp.net". We must strip both @ and :
      // However, if the sender uses WhatsApp Privacy (LID), it looks like "155069911670814@lid"
      let realPhoneJid = senderId;
      if (senderId.includes('@lid')) {
        const alt = msg.key.senderPn || msg.key.participantPn || msg.participant || msg.key.remoteJidAlt;
        if (alt && alt.includes('@s.whatsapp.net')) {
          realPhoneJid = alt;
        }
      }

      const isLid = realPhoneJid.includes('@lid');
      const customerPhone = isLid ? null : realPhoneJid.split('@')[0].split(':')[0];
      const customerName = msg.pushName || 'Unknown';
      
      const settings = await this.prisma.setting.findUnique({ where: { businessId: businessId } });
      const aiConfig: any = settings?.aiConfig || {};
      
      const requireWhitelist = aiConfig.requireWhitelist === true; 
      const whitelistedNumbers: string[] = Array.isArray(aiConfig.whitelistedNumbers) ? aiConfig.whitelistedNumbers : [];

      if (requireWhitelist) {
        if (!whitelistedNumbers.includes(senderId) && whitelistedNumbers.length > 0) {
          this.logger.warn(`[${businessId}] Ignored message from ${senderId} (Not in whitelist)`);
          return;
        } else if (whitelistedNumbers.length === 0) {
          this.logger.warn(`[${businessId}] Received message from ${senderId}, but whitelist is empty. AI DISABLED.`);
          return;
        }
      }

      this.logger.log(`[${businessId}] Received message from ${customerName} (+${customerPhone}): ${content}`);

      const aiResponse = await this.conversationsService.processMessage({
        businessId: businessId, 
        customerPhone: customerPhone ? `+${customerPhone}` : '',
        customerName: customerName,
        source: 'WHATSAPP',
        externalId: senderId,
        content: content,
      });

      if (aiResponse && aiResponse.message) {
        await client.sendMessage(senderId, { text: aiResponse.message });
        this.logger.log(`[${businessId}] AI Replied to ${customerName}: ${aiResponse.message}`);
      }

    } catch (error) {
      this.logger.error(`[${businessId}] Error processing WhatsApp message:`, error);
    }
  }

  public async getSessionStatus(businessId: string) {
    const client = this.clients.get(businessId);
    if (!client) return { status: 'DISCONNECTED' };

    return {
      status: 'CONNECTED',
      user: client.user,
    };
  }

  async sendMessageToCustomer(businessId: string, remoteJid: string, text: string) {
    const client = this.clients.get(businessId);
    if (!client) {
      throw new Error(`No active WhatsApp session for business ${businessId}`);
    }
    await client.sendMessage(remoteJid, { text });
  }

  public async sendWhatsappMessage(businessId: string, toPhone: string, message: string) {
    const client = this.clients.get(businessId);
    if (!client) {
      throw new Error(`WhatsApp client not connected for business ${businessId}`);
    }
    const jid = `${toPhone.replace('+', '')}@s.whatsapp.net`;
    await client.sendMessage(jid, { text: message });
  }

  public getStatus(businessId: string) {
    return {
      connected: this.connectionStatus.get(businessId) || false,
      qr: this.qrCodes.get(businessId) || null
    };
  }
}

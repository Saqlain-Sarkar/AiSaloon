import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private clients: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private connectionStatus: Map<string, boolean> = new Map();
  private processedMessages: Set<string> = new Set();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing WhatsApp Service Manager (Baileys)...');
    try {
      if (fs.existsSync('./whatsapp-auth')) {
        const dirs = fs.readdirSync('./whatsapp-auth', { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('session-'))
          .map(dirent => dirent.name.replace('session-', ''));
          
        for (const businessId of dirs) {
          this.logger.log(`Auto-starting WhatsApp client for business: ${businessId}`);
          await this.initializeClient(businessId);
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
    
    // We use a specific directory per businessId for persistent sessions
    const sessionDir = path.join('./whatsapp-auth', `session-${businessId}`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const client = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any, 
    });

    this.clients.set(businessId, client);
    this.connectionStatus.set(businessId, false);

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        this.qrCodes.set(businessId, qr);
        this.connectionStatus.set(businessId, false);
        this.logger.log(`[${businessId}] New QR Code generated. Scan to pair.`);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        this.logger.warn(`[${businessId}] Connection closed, reconnecting: ${shouldReconnect}`);
        
        this.connectionStatus.set(businessId, false);
        this.clients.delete(businessId);
        this.qrCodes.delete(businessId);
        
        if (shouldReconnect) {
          // Reconnect logic
          setTimeout(() => {
            this.initializeClient(businessId);
          }, 5000);
        } else {
          // Logged out, clean up session directory
          this.logger.log(`[${businessId}] User logged out. Cleaning up session.`);
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
      } else if (connection === 'open') {
        this.logger.log(`[${businessId}] WhatsApp Client is Ready! AI is now connected.`);
        this.connectionStatus.set(businessId, true);
        this.qrCodes.delete(businessId); 
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
      const customerPhone = senderId.split('@')[0].split(':')[0];
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
        customerPhone: `+${customerPhone}`,
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

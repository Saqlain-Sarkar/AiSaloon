import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private clients: Map<string, Client> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private connectionStatus: Map<string, boolean> = new Map();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing WhatsApp Service Manager...');
    // Load clients for businesses that already have an active session cache
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
      await client.destroy();
    }
  }

  public async initializeClient(businessId: string): Promise<void> {
    if (this.clients.has(businessId)) {
      return; // Already initialized
    }

    this.logger.log(`Starting new WhatsApp Client for business: ${businessId}`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: businessId,
        dataPath: './whatsapp-auth',
      }),
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }
    });

    this.clients.set(businessId, client);
    this.connectionStatus.set(businessId, false);
    this.initializeListeners(businessId, client);

    try {
      await client.initialize();
    } catch (error) {
      this.logger.error(`Failed to initialize WhatsApp Client for ${businessId}`, error);
      this.clients.delete(businessId);
    }
  }

  private initializeListeners(businessId: string, client: Client) {
    client.on('qr', (qr) => {
      this.qrCodes.set(businessId, qr);
      this.connectionStatus.set(businessId, false);
      this.logger.log(`[${businessId}] Scan the QR code to pair your WhatsApp account`);
    });

    client.on('ready', () => {
      this.qrCodes.delete(businessId);
      this.connectionStatus.set(businessId, true);
      this.logger.log(`[${businessId}] WhatsApp Client is Ready! AI is now connected.`);
    });
    
    client.on('disconnected', () => {
       this.connectionStatus.set(businessId, false);
       this.logger.warn(`[${businessId}] WhatsApp Client Disconnected.`);
    });

    client.on('auth_failure', (msg) => {
      this.logger.error(`[${businessId}] WhatsApp Auth Failure: ${msg}`);
    });

    client.on('message', async (msg: Message) => {
      await this.handleIncomingMessage(businessId, msg);
    });
  }

  private async handleIncomingMessage(businessId: string, msg: Message) {
    try {
      if (msg.from.endsWith('@g.us')) return; 
      if (msg.isStatus) return; 
      if (msg.type !== 'chat') return; 

      const contact = await msg.getContact();
      const customerPhone = contact.number; 
      const customerName = contact.pushname || contact.name || 'Unknown';
      const senderId = msg.from; 
      
      const settings = await this.prisma.setting.findUnique({ where: { businessId: businessId } });
      const aiConfig: any = settings?.aiConfig || {};
      
      const requireWhitelist = aiConfig.requireWhitelist === true; 
      const whitelistedNumbers: string[] = Array.isArray(aiConfig.whitelistedNumbers) ? aiConfig.whitelistedNumbers : [];

      if (requireWhitelist) {
        if (!whitelistedNumbers.includes(senderId) && whitelistedNumbers.length > 0) {
          this.logger.warn(`[${businessId}] Ignored message from ${senderId} (Not in DB whitelist)`);
          return;
        } else if (whitelistedNumbers.length === 0) {
          this.logger.warn(`[${businessId}] Received message from ${senderId}, but DB whitelist is empty. AI is DISABLED.`);
          return;
        }
      }

      this.logger.log(`[${businessId}] Received message from ${customerName} (${customerPhone}): ${msg.body}`);

      const aiResponse = await this.conversationsService.processMessage({
        businessId: businessId, 
        customerPhone: `+${customerPhone}`,
        customerName: customerName,
        source: 'WHATSAPP',
        externalId: senderId,
        content: msg.body,
      });

      if (aiResponse && aiResponse.message) {
        const client = this.clients.get(businessId);
        if (client) {
          await client.sendMessage(senderId, aiResponse.message);
          this.logger.log(`[${businessId}] AI Replied to ${customerName}: ${aiResponse.message}`);
        }
      }

    } catch (error) {
      this.logger.error(`[${businessId}] Error processing WhatsApp message:`, error);
    }
  }

  public getStatus(businessId: string) {
    return {
      connected: this.connectionStatus.get(businessId) || false,
      qr: this.qrCodes.get(businessId) || null
    };
  }
}

import { Controller, Get, Post, Body, Param, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser, Public } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';

import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('chat')
  @Public()
  @ApiOperation({ summary: 'Send a message to the AI and get a response' })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.conversationsService.processMessage(dto);
  }

  @Post('messages')
  @Public()
  @ApiOperation({ summary: 'Store a raw message (e.g. from Make.com webhook) without triggering AI' })
  async storeRawMessage(@Body() dto: any) {
    return this.conversationsService.saveRawMessage({
      businessId: dto.businessId,
      customerPhone: dto.customerPhone || dto.phone,
      customerName: dto.customerName || dto.name,
      source: dto.source || 'WHATSAPP',
      externalId: dto.externalId,
      content: dto.content,
      role: dto.role || 'CUSTOMER',
    });
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List conversations' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('customerId') customerId?: string,
    @Query('source') source?: string,
  ) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.conversationsService.findAll(bizId, { customerId, source });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation with messages' })
  async findById(@Param('id') id: string) {
    return this.conversationsService.findById(id);
  }

  @Get(':id/messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages for a conversation' })
  async getMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.getMessages(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post(':id/takeover')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle AI managing state for a conversation' })
  async toggleAiManaging(
    @Param('id') id: string,
    @Body('isAiManaging') isAiManaging: boolean
  ) {
    return this.conversationsService.toggleAiManaging(id, isAiManaging);
  }

  @Post(':id/messages/send')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a manual message from the staff to the customer' })
  async sendManualMessage(
    @Param('id') id: string,
    @Body('content') content: string
  ) {
    return this.conversationsService.sendManualMessage(id, content);
  }
}

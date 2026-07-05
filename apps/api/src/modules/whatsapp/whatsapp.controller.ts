import { Controller, Get, Param, Res, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('qr/:businessId')
  @Public()
  @ApiOperation({ summary: 'Get WhatsApp Connection Status and QR Code for a Business' })
  @ApiParam({ name: 'businessId', required: true, description: 'The ID of the business' })
  async getStatus(@Param('businessId') businessId: string, @Res() res: any, @Req() req: any) {
    
    // Verify business exists
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Attempt to initialize if it hasn't been started yet
    await this.whatsappService.initializeClient(businessId);

    const status = this.whatsappService.getStatus(businessId);
    
    if (status.connected) {
      if (req.headers.accept?.includes('application/json')) {
        return res.json({ connected: true });
      }
      return res.send("WhatsApp is already connected for this business!");
    }
    
    if (!status.qr) {
      if (req.headers.accept?.includes('application/json')) {
        return res.json({ connected: false, message: "Starting up..." });
      }
      return res.send("WhatsApp is starting up or generating QR code... Please refresh in 5 seconds.");
    }
    
    try {
      const qrcode = require('qrcode');
      const qrImageUrl = await qrcode.toDataURL(status.qr, { margin: 2, scale: 6 });
      
      if (req.headers.accept?.includes('application/json')) {
        return res.json({ connected: false, qrImageUrl });
      }
      
      return res.send(`
        <html>
          <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
            <h2>Scan to Connect WhatsApp AI for ${business.name}</h2>
            <img src="${qrImageUrl}" alt="WhatsApp QR Code" />
            <p>Refresh this page if the QR code expires (approx 20 seconds).</p>
          </body>
        </html>
      `);
    } catch (err) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ error: "Error generating QR code image" });
      }
      return res.send("Error generating QR code image.");
    }
  }
}

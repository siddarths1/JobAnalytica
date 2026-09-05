import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VisualDiscoveryService } from './visual-discovery.service';

@Controller('discovery/visual')
@UseGuards(JwtAuthGuard)
export class VisualDiscoveryController {
  constructor(private readonly visualDiscoveryService: VisualDiscoveryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('screenshot'))
  async uploadScreenshot(
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('base64Image') base64Image?: string,
    @Body('mimeType') mimeType?: string,
    @Body('rawText') rawText?: string,
    @Body('platform') platform?: 'NAUKRI' | 'LINKEDIN' | 'OTHER',
  ) {
    if (file) {
      return this.visualDiscoveryService.processScreenshot(
        userId,
        file.buffer,
        file.mimetype || 'image/png',
        file.originalname,
      );
    }

    if (base64Image) {
      const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      return this.visualDiscoveryService.processScreenshot(
        userId,
        buffer,
        mimeType || 'image/png',
      );
    }

    if (rawText) {
      return this.visualDiscoveryService.processText(userId, rawText, platform);
    }

    throw new BadRequestException('Please provide a screenshot file, base64 image, or raw text.');
  }

  @Get()
  async getEntries(
    @CurrentUser('id') userId: string,
    @Query('filter') filter?: 'ACTIVE' | 'ARCHIVED' | 'ALL',
  ) {
    const data = await this.visualDiscoveryService.getUserEntries(userId, filter);
    return {
      success: true,
      count: data.length,
      entries: data,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') entryId: string,
    @Body('status') status: 'APPLIED' | 'DONE' | 'DISMISSED' | 'ACTIVE',
  ) {
    return this.visualDiscoveryService.updateStatus(userId, entryId, status);
  }

  @Post(':id/restore')
  async restore(
    @CurrentUser('id') userId: string,
    @Param('id') entryId: string,
  ) {
    return this.visualDiscoveryService.restoreEntry(userId, entryId);
  }

  @Delete(':id')
  async deleteEntry(
    @CurrentUser('id') userId: string,
    @Param('id') entryId: string,
  ) {
    return this.visualDiscoveryService.deleteEntry(userId, entryId);
  }
}

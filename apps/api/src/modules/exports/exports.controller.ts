import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('csv')
  async exportCsv(
    @Res() res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="jobanalytica_applications.csv"');
    await this.exportsService.streamApplicationsCsv(res, userId);
  }
}

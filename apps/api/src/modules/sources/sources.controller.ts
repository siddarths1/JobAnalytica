import { Controller, Get, UseGuards } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  async getSources() {
    return this.sourcesService.getAllSources();
  }

  @Get('health')
  async getSourcesHealth() {
    return this.sourcesService.checkSourcesHealth();
  }
}

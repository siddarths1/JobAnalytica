import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sources')
@UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  getSources() {
    return this.sourcesService.getSourcesHealth();
  }

  @Post(':code/sync')
  syncSource(@Param('code') code: string) {
    return this.sourcesService.syncSource(code);
  }
}

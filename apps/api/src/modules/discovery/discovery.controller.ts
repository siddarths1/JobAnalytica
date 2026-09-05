import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('hubs')
  getHubs(@Query('country') country?: string) {
    return this.discoveryService.getHubs(country);
  }

  @Get('companies')
  getCompanies(
    @Query('hubId') hubId?: string,
    @Query('tier') tier?: string,
  ) {
    return this.discoveryService.getCompanies(hubId, tier);
  }

  @Post('crawl')
  async crawlHubs(
    @CurrentUser('id') userId: string,
    @Body() body: { hubId?: string; tier?: string; limit?: number },
  ) {
    return this.discoveryService.crawlHubs(userId, body);
  }

  @Post('validate')
  async validatePostings() {
    return this.discoveryService.validatePostings();
  }
}

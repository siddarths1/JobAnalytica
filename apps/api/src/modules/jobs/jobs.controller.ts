import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportCustomJobDto } from './dto/job.dto';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('feed')
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('profileId') profileId?: string,
  ) {
    return this.jobsService.getFeed(userId, profileId);
  }

  @Post('sync')
  async triggerSync(@CurrentUser('id') userId: string) {
    const res = await this.jobsService.syncAllSources();
    await this.jobsService.generateMatchesForUser(userId);
    return res;
  }

  @Post('import-custom')
  async importCustom(
    @CurrentUser('id') userId: string,
    @Body() dto: ImportCustomJobDto,
  ) {
    return this.jobsService.importCustomJob(userId, dto);
  }
}

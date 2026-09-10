import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomJobImportDto } from './dto/job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(
    @CurrentUser('id') userId: string,
    @Query('tier') tier?: string,
    @Query('hubId') hubId?: string,
  ) {
    return this.jobsService.getUserFeed(userId, { tier, hubId });
  }

  @Post('import-custom')
  @UseGuards(JwtAuthGuard)
  importCustom(
    @CurrentUser('id') userId: string,
    @Body() dto: CustomJobImportDto,
  ) {
    return this.jobsService.importCustomJob(userId, dto);
  }

  @Post('match/recalculate')
  @UseGuards(JwtAuthGuard)
  async recalculateMatches(@CurrentUser('id') userId: string) {
    await this.jobsService.generateMatchesForUser(userId);
    return { success: true, message: 'Matches updated across all candidate resume profiles.' };
  }
}

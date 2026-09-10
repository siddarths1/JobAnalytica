import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApplicationStatus } from '@jobanalytica/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly appsService: ApplicationsService) {}

  @Get()
  async getApplications(
    @CurrentUser() user: any,
    @Query('status') status?: ApplicationStatus,
  ) {
    return this.appsService.getUserApplications(user.id, status);
  }

  @Post()
  async createApplication(
    @CurrentUser() user: any,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.appsService.createApplication(user.id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.appsService.updateStatus(user.id, id, dto);
  }
}

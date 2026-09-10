import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateStatusDto } from './dto/application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async getApplications(@CurrentUser('id') userId: string) {
    return this.applicationsService.getApplications(userId);
  }

  @Post()
  async createApplication(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.createApplication(userId, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.applicationsService.updateStatus(userId, id, dto);
  }

  @Delete(':id')
  async deleteApplication(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.deleteApplication(userId, id);
  }
}

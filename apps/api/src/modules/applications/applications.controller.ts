import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  getUserApplications(@CurrentUser('id') userId: string) {
    return this.applicationsService.getUserApplications(userId);
  }

  @Post()
  createApplication(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.createApplication(userId, dto);
  }

  @Patch(':id')
  updateApplication(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.updateApplication(userId, id, dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCandidateProfileDto } from './dto/resume.dto';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  getProfiles(@CurrentUser('id') userId: string) {
    return this.resumesService.getUserProfiles(userId);
  }

  @Post('profile')
  createProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCandidateProfileDto,
  ) {
    return this.resumesService.createCandidateProfile(userId, dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadResume(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('label') label?: string,
  ) {
    return this.resumesService.uploadAndParseResume(userId, file, label);
  }

  @Patch(':id/primary')
  setPrimary(
    @CurrentUser('id') userId: string,
    @Param('id') profileId: string,
  ) {
    return this.resumesService.setPrimaryProfile(userId, profileId);
  }

  @Delete(':id')
  deleteProfile(
    @CurrentUser('id') userId: string,
    @Param('id') profileId: string,
  ) {
    return this.resumesService.deleteProfile(userId, profileId);
  }
}

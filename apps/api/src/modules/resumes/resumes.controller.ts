import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateCandidateProfileDto } from './dto/resume.dto';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadResume(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('label') label?: string,
  ) {
    return this.resumesService.uploadAndParsePdf(userId, file, label);
  }

  @Get()
  async getResumes(@CurrentUser('id') userId: string) {
    return this.resumesService.getAllProfiles(userId);
  }

  @Get('profiles')
  async getAllProfiles(@CurrentUser('id') userId: string) {
    return this.resumesService.getAllProfiles(userId);
  }

  @Patch('profile/:id/primary')
  async setPrimary(
    @CurrentUser('id') userId: string,
    @Param('id') profileId: string,
  ) {
    return this.resumesService.setPrimaryProfile(userId, profileId);
  }

  @Put('profile/:id')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Param('id') profileId: string,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.resumesService.updateProfile(userId, profileId, dto);
  }

  @Delete('profile/:id')
  async deleteProfile(
    @CurrentUser('id') userId: string,
    @Param('id') profileId: string,
  ) {
    return this.resumesService.deleteProfile(userId, profileId);
  }
}

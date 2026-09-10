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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { UpdateResumeDto } from './dto/resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  async getResumes(@CurrentUser() user: any) {
    return this.resumesService.getUserResumes(user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Resume file is required (PDF format)');
    }
    return this.resumesService.uploadResume(user.id, file);
  }

  @Patch(':id/primary')
  async setPrimary(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.resumesService.setPrimaryResume(user.id, id);
  }

  @Delete(':id')
  async deleteResume(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.resumesService.deleteResume(user.id, id);
  }
}

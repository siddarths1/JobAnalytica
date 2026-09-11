import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LlmModule } from '../../common/llm/llm.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [PrismaModule, LlmModule, JobsModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}

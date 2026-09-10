import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LlmModule } from '../../common/llm/llm.module';

@Module({
  imports: [PrismaModule, LlmModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}

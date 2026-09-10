import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GreenhouseAdapter } from '../../adapters/greenhouse/greenhouse.adapter';
import { LeverAdapter } from '../../adapters/lever/lever.adapter';
import { AshbyAdapter } from '../../adapters/ashby/ashby.adapter';
import { AdzunaAdapter } from '../../adapters/adzuna/adzuna.adapter';

@Module({
  imports: [PrismaModule],
  controllers: [SourcesController],
  providers: [
    SourcesService,
    GreenhouseAdapter,
    LeverAdapter,
    AshbyAdapter,
    AdzunaAdapter,
  ],
  exports: [SourcesService],
})
export class SourcesModule {}

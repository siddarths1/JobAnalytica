import { Module, forwardRef } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AdzunaAdapter } from '../../adapters/adzuna/adzuna.adapter';
import { GreenhouseAdapter } from '../../adapters/greenhouse/greenhouse.adapter';
import { LeverAdapter } from '../../adapters/lever/lever.adapter';
import { AshbyAdapter } from '../../adapters/ashby/ashby.adapter';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    AdzunaAdapter,
    GreenhouseAdapter,
    LeverAdapter,
    AshbyAdapter,
  ],
  exports: [JobsService],
})
export class JobsModule {}

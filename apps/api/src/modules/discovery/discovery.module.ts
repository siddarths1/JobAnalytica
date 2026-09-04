import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { AtsResolverService } from './ats-resolver.service';
import { FreshnessValidatorService } from './freshness-validator.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, AtsResolverService, FreshnessValidatorService],
  exports: [DiscoveryService, AtsResolverService, FreshnessValidatorService],
})
export class DiscoveryModule {}

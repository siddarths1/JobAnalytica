import { Module, forwardRef } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { AtsResolverService } from './ats-resolver.service';
import { FreshnessValidatorService } from './freshness-validator.service';
import { VisualDiscoveryService } from './visual-discovery.service';
import { VisualDiscoveryController } from './visual-discovery.controller';
import { JobsModule } from '../jobs/jobs.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [
    forwardRef(() => JobsModule),
    forwardRef(() => ApplicationsModule),
  ],
  controllers: [DiscoveryController, VisualDiscoveryController],
  providers: [
    DiscoveryService,
    AtsResolverService,
    FreshnessValidatorService,
    VisualDiscoveryService,
  ],
  exports: [DiscoveryService, AtsResolverService, FreshnessValidatorService, VisualDiscoveryService],
})
export class DiscoveryModule {}

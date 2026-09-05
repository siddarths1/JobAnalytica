import { Injectable, Logger } from '@nestjs/common';
import { INDIA_TOP_TECH_HUBS } from './geo.constants';
import { TOP_COMPANIES_BY_HUB, TargetCompany } from './company-directory.constants';
import { AtsResolverService } from './ats-resolver.service';
import { FreshnessValidatorService } from './freshness-validator.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly atsResolver: AtsResolverService,
    private readonly freshnessValidator: FreshnessValidatorService,
    private readonly jobsService: JobsService,
  ) {}

  getHubs(country: string = 'India') {
    return INDIA_TOP_TECH_HUBS;
  }

  getCompanies(hubId?: string, tier?: string): TargetCompany[] {
    let list = TOP_COMPANIES_BY_HUB;
    if (hubId && hubId !== 'ALL') {
      list = list.filter(c => c.hubId === hubId);
    }
    if (tier && tier !== 'ALL') {
      list = list.filter(c => c.tier === tier);
    }
    return list;
  }

  async crawlHubs(userId: string, options: { hubId?: string; tier?: string; limit?: number }) {
    const targetCompanies = this.getCompanies(options.hubId, options.tier);
    const limit = options.limit || targetCompanies.length;
    const selected = targetCompanies.slice(0, limit);

    let totalIngested = 0;

    for (const company of selected) {
      try {
        const jobs = await this.atsResolver.resolveCompanyJobs(company);
        for (const j of jobs) {
          await this.jobsService.ingestJob(j);
          totalIngested++;
        }
      } catch (err: any) {
        this.logger.error(`Failed to resolve jobs for ${company.name}: ${err.message}`);
      }
    }

    // Automatically recalculate multi-resume matches across candidate profiles!
    await this.jobsService.generateMatchesForUser(userId);

    return {
      success: true,
      hubsProcessed: options.hubId && options.hubId !== 'ALL' ? [options.hubId] : INDIA_TOP_TECH_HUBS.map(h => h.id),
      companiesCrawled: selected.length,
      jobsIngested: totalIngested,
      message: `Crawled ${selected.length} companies across tech hubs. Ingested and scored ${totalIngested} jobs!`,
    };
  }

  async validatePostings() {
    return this.freshnessValidator.validatePostings();
  }
}

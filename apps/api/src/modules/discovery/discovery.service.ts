import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GreenhouseAdapter } from '../../adapters/greenhouse/greenhouse.adapter';
import { LeverAdapter } from '../../adapters/lever/lever.adapter';
import { AshbyAdapter } from '../../adapters/ashby/ashby.adapter';
import { AdzunaAdapter } from '../../adapters/adzuna/adzuna.adapter';
import { FreshnessValidatorService } from './freshness-validator.service';
import { NormalizedJob } from '../../adapters/base/job-source-adapter.interface';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly greenhouse: GreenhouseAdapter,
    private readonly lever: LeverAdapter,
    private readonly ashby: AshbyAdapter,
    private readonly adzuna: AdzunaAdapter,
    private readonly freshnessValidator: FreshnessValidatorService,
  ) {}

  async runDiscovery() {
    this.logger.log('Starting automated job discovery across all ATS adapters...');
    const adapters = [this.greenhouse, this.lever, this.ashby, this.adzuna];
    let totalDiscovered = 0;
    let totalInserted = 0;

    for (const adapter of adapters) {
      const info = adapter.getSourceInfo();
      try {
        const jobs = await adapter.search({});
        totalDiscovered += jobs.length;

        for (const job of jobs) {
          const isFresh = await this.freshnessValidator.isJobFresh(job);
          if (!isFresh) continue;

          await this.upsertJob(job);
          totalInserted++;
        }
      } catch (err: any) {
        this.logger.error(`Error discovering from ${info.name}: ${err.message}`);
      }
    }

    this.logger.log(`Discovery complete. Found ${totalDiscovered} jobs, persisted ${totalInserted} active postings.`);
    return { totalDiscovered, totalInserted };
  }

  private async upsertJob(job: NormalizedJob) {
    let source = await this.prisma.jobSource.findUnique({
      where: { code: job.sourceCode },
    });

    if (!source) {
      source = await this.prisma.jobSource.create({
        data: {
          code: job.sourceCode,
          name: job.sourceCode.toUpperCase(),
          isApi: true,
          isActive: true,
        },
      });
    }

    const externalId = job.externalId || `${job.company}-${job.title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');

    return this.prisma.job.upsert({
      where: {
        sourceId_externalId: {
          sourceId: source.id,
          externalId,
        },
      },
      update: {
        title: job.title,
        company: job.company,
        location: job.location,
        workMode: job.workMode,
        employmentType: job.employmentType,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        currency: job.currency,
        description: job.description,
        requiredSkills: JSON.stringify(job.requiredSkills || []),
        minExperience: job.minExperience,
        primaryApplyUrl: job.applyUrl,
        updatedAt: new Date(),
      },
      create: {
        sourceId: source.id,
        externalId,
        title: job.title,
        company: job.company,
        location: job.location,
        workMode: job.workMode,
        employmentType: job.employmentType,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        currency: job.currency,
        description: job.description,
        requiredSkills: JSON.stringify(job.requiredSkills || []),
        minExperience: job.minExperience,
        primaryApplyUrl: job.applyUrl,
        sourceUrl: job.sourceUrl,
        postedAt: job.postedAt || new Date(),
      },
    });
  }
}

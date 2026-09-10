import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GreenhouseAdapter } from '../../adapters/greenhouse/greenhouse.adapter';
import { LeverAdapter } from '../../adapters/lever/lever.adapter';
import { AshbyAdapter } from '../../adapters/ashby/ashby.adapter';
import { AdzunaAdapter } from '../../adapters/adzuna/adzuna.adapter';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly greenhouse: GreenhouseAdapter,
    private readonly lever: LeverAdapter,
    private readonly ashby: AshbyAdapter,
    private readonly adzuna: AdzunaAdapter,
  ) {}

  async getAllSources() {
    return this.prisma.jobSource.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async checkSourcesHealth() {
    const adapters = [
      { name: 'Greenhouse Public ATS', code: 'greenhouse', adapter: this.greenhouse },
      { name: 'Lever Public ATS', code: 'lever', adapter: this.lever },
      { name: 'Ashby Public ATS', code: 'ashby', adapter: this.ashby },
      { name: 'Adzuna Global', code: 'adzuna', adapter: this.adzuna },
    ];

    const results = [];
    for (const item of adapters) {
      const isHealthy = await item.adapter.healthCheck();
      results.push({
        name: item.name,
        code: item.code,
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        lastChecked: new Date().toISOString(),
      });
    }

    return results;
  }
}

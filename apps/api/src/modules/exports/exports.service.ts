import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCsv(userId: string): Promise<string> {
    const applications = await this.prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Company', 'Title', 'Location', 'Status', 'Applied Date', 'Apply URL', 'Notes'];
    const rows = applications.map((app) => [
      `"${app.job.company.replace(/"/g, '""')}"`,
      `"${app.job.title.replace(/"/g, '""')}"`,
      `"${app.job.location.replace(/"/g, '""')}"`,
      app.status,
      app.appliedAt ? app.appliedAt.toISOString().split('T')[0] : '',
      `"${app.job.primaryApplyUrl}"`,
      `"${(app.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

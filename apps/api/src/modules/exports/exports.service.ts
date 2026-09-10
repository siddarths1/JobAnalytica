import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Response } from 'express';
import { format } from 'fast-csv';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async streamApplicationsCsv(res: Response, userId?: string): Promise<void> {
    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    const applications = await this.prisma.application.findMany({
      where: userId ? { userId } : {},
      include: {
        job: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    for (const app of applications) {
      csvStream.write({
        ID: app.id,
        Title: app.job.title,
        Company: app.job.company,
        Location: app.job.location,
        Status: app.status,
        AppliedAt: app.appliedAt ? app.appliedAt.toISOString() : '',
        Notes: app.notes || '',
        SalaryOffered: app.salaryOffered || '',
        InterviewDate: app.interviewDate ? app.interviewDate.toISOString() : '',
        ApplyUrl: app.job.primaryApplyUrl,
      });
    }

    csvStream.end();
  }
}

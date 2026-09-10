import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePreferenceDto } from './dto/preference.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPreferences(userId: string) {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      return {
        targetRoles: ['Software Engineer'],
        locations: ['Remote'],
        workModes: ['REMOTE', 'HYBRID'],
        currency: 'INR',
      };
    }

    return {
      targetRoles: JSON.parse(pref.targetRoles || '[]'),
      locations: JSON.parse(pref.locations || '[]'),
      workModes: JSON.parse(pref.workModes || '[]'),
      minSalary: pref.minSalary,
      currency: pref.currency,
    };
  }

  async updateUserPreferences(userId: string, dto: UpdatePreferenceDto) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: {
        targetRoles: dto.targetRoles ? JSON.stringify(dto.targetRoles) : undefined,
        locations: dto.locations ? JSON.stringify(dto.locations) : undefined,
        workModes: dto.workModes ? JSON.stringify(dto.workModes) : undefined,
        minSalary: dto.minSalary,
        currency: dto.currency,
      },
      create: {
        userId,
        targetRoles: JSON.stringify(dto.targetRoles || ['Software Engineer']),
        locations: JSON.stringify(dto.locations || ['Remote']),
        workModes: JSON.stringify(dto.workModes || ['REMOTE', 'HYBRID']),
        minSalary: dto.minSalary,
        currency: dto.currency || 'INR',
      },
    });
  }
}

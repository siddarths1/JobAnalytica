import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePreferenceDto } from './dto/preference.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPreferences(userId: string) {
    let pref = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await this.prisma.userPreference.create({
        data: { userId },
      });
    }

    return {
      id: pref.id,
      userId: pref.userId,
      targetRoles: JSON.parse(pref.targetRoles || '[]'),
      locations: JSON.parse(pref.locations || '[]'),
      workModes: JSON.parse(pref.workModes || '[]'),
      preferredTiers: JSON.parse(pref.preferredTiers || '[]'),
      minSalary: pref.minSalary,
      maxSalary: pref.maxSalary,
      currency: pref.currency,
      minExperience: pref.minExperience,
      maxExperience: pref.maxExperience,
      preferredCompanies: JSON.parse(pref.preferredCompanies || '[]'),
      excludedCompanies: JSON.parse(pref.excludedCompanies || '[]'),
      enableDailyDigest: pref.enableDailyDigest,
      digestTime: pref.digestTime,
    };
  }

  async updateUserPreferences(userId: string, dto: UpdatePreferenceDto) {
    const dataToUpdate: any = {};

    if (dto.targetRoles) dataToUpdate.targetRoles = JSON.stringify(dto.targetRoles);
    if (dto.locations) dataToUpdate.locations = JSON.stringify(dto.locations);
    if (dto.workModes) dataToUpdate.workModes = JSON.stringify(dto.workModes);
    if (dto.preferredTiers) dataToUpdate.preferredTiers = JSON.stringify(dto.preferredTiers);
    if (dto.minSalary !== undefined) dataToUpdate.minSalary = dto.minSalary;
    if (dto.maxSalary !== undefined) dataToUpdate.maxSalary = dto.maxSalary;
    if (dto.minExperience !== undefined) dataToUpdate.minExperience = dto.minExperience;
    if (dto.preferredCompanies) dataToUpdate.preferredCompanies = JSON.stringify(dto.preferredCompanies);
    if (dto.excludedCompanies) dataToUpdate.excludedCompanies = JSON.stringify(dto.excludedCompanies);
    if (dto.enableDailyDigest !== undefined) dataToUpdate.enableDailyDigest = dto.enableDailyDigest;
    if (dto.digestTime !== undefined) dataToUpdate.digestTime = dto.digestTime;

    const updated = await this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...dataToUpdate },
      update: dataToUpdate,
    });

    return this.getUserPreferences(userId);
  }
}

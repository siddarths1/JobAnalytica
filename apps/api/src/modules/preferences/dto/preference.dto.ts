import { IsArray, IsOptional, IsBoolean, IsNumber, IsString } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional()
  @IsArray()
  targetRoles?: string[];

  @IsOptional()
  @IsArray()
  locations?: string[];

  @IsOptional()
  @IsArray()
  workModes?: string[];

  @IsOptional()
  @IsArray()
  preferredTiers?: string[];

  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @IsOptional()
  @IsNumber()
  minExperience?: number;

  @IsOptional()
  @IsArray()
  preferredCompanies?: string[];

  @IsOptional()
  @IsArray()
  excludedCompanies?: string[];

  @IsOptional()
  @IsBoolean()
  enableDailyDigest?: boolean;

  @IsOptional()
  @IsString()
  digestTime?: string;
}

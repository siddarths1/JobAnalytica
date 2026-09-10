import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { WorkMode, EmploymentType } from '@jobanalytica/shared-types';

export class CustomJobImportDto {
  @IsString()
  title: string;

  @IsString()
  company: string;

  @IsString()
  location: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @IsOptional()
  @IsString()
  applyUrl?: string;
}

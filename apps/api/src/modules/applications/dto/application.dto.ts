import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApplicationStatus } from '@jobanalytica/shared-types';

export class CreateApplicationDto {
  @IsString()
  jobId: string;

  @IsOptional()
  @IsString()
  resumeLabel?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsDateString()
  appliedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  salaryOffered?: number;

  @IsOptional()
  @IsDateString()
  interviewDate?: string;
}

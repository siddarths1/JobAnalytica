import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@jobanalytica/shared-types';

export class CreateApplicationDto {
  @IsString()
  jobId: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  resumeId?: string;
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@jobanalytica/shared-types';

export class CreateApplicationDto {
  @IsString()
  jobId: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

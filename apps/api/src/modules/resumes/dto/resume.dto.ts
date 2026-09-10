import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCandidateProfileDto {
  @IsNumber()
  totalExperience: number;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsString({ each: true })
  targetRoles: string[];

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @IsString({ each: true })
  primaryLanguages: string[];

  @IsArray()
  @IsString({ each: true })
  frameworks: string[];

  @IsArray()
  @IsString({ each: true })
  domains: string[];

  @IsOptional()
  education?: any;

  @IsOptional()
  workHistory?: any;
}

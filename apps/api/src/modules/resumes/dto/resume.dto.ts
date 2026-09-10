import { IsString, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class CreateCandidateProfileDto {
  @IsString()
  label: string;

  @IsNumber()
  totalExperience: number;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsArray()
  targetRoles: string[];

  @IsArray()
  skills: string[];

  @IsOptional()
  @IsArray()
  primaryLanguages?: string[];

  @IsOptional()
  @IsArray()
  frameworks?: string[];

  @IsOptional()
  @IsArray()
  domains?: string[];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

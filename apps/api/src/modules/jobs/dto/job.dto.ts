import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportCustomJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  workMode?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  applyUrl?: string;
}

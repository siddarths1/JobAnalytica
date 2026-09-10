import { IsOptional, IsArray, IsString, IsNumber, Min } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workModes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

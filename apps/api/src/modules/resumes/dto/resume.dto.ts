import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateResumeDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

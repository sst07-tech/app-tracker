import { IsString, IsOptional, IsIn, IsUrl } from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsIn(['Applied', 'Interview', 'Offer', 'Rejected'])
  status?: 'Applied' | 'Interview' | 'Offer' | 'Rejected';

  @IsOptional()
  @IsString()
  appliedOn?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUrl()
  resumeUrl?: string;
}

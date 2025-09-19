import { IsString, IsOptional, IsIn, IsUrl } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  company!: string;

  @IsString()
  role!: string;

  @IsIn(['Applied', 'Interview', 'Offer', 'Rejected'])
  status!: 'Applied' | 'Interview' | 'Offer' | 'Rejected';

  @IsOptional()
  @IsString()
  appliedOn?: string; // ISO date string

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUrl()
  resumeUrl?: string;
}

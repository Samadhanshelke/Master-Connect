import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MinLength(1)
  orgName!: string;

  @IsString()
  @MinLength(1)
  position!: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsOptional()
  @IsString()
  contact?: string;
}

export class SetJobStatusDto {
  @IsIn(['active', 'closed'])
  status!: 'active' | 'closed';
}

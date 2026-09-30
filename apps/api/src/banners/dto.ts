import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @MinLength(1)
  date!: string;

  @IsOptional()
  @IsString()
  imageUri?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;
}

export class SetBannerStatusDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}

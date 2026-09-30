import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class SetRoleDto {
  @IsString()
  @IsIn(['citizen', 'shop_owner', 'admin'])
  role!: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}

export class ToggleFlagDto {
  @IsBoolean()
  active!: boolean;
}

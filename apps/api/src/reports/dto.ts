import { IsBoolean, IsOptional } from 'class-validator';

export class ResolveReportDto {
  @IsOptional()
  @IsBoolean()
  deletePost?: boolean;
}

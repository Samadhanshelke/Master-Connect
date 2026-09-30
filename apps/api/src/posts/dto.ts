import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  attachment?: string;

  @IsOptional()
  @IsIn(['local', 'global'])
  visibility?: 'local' | 'global';

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  authorName?: string;
}

export class CommentDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

export class ReportPostDto {
  @IsOptional()
  @IsString()
  content?: string;
}

import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  clientKey!: string;

  @IsString()
  type!: string;

  @IsString()
  recipientId!: string;

  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsString()
  postId?: string;
}

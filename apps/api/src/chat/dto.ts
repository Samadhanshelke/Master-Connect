import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  attachment?: string;
}

export class VotePollDto {
  @IsInt()
  @Min(0)
  optionIndex!: number;
}

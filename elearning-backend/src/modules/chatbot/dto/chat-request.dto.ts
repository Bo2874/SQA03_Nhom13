
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class ChatRequestDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];
}

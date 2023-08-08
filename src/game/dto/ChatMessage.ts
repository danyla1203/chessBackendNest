import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChatMessage {
  @MinLength(1)
  @MaxLength(50)
  @IsString()
  text: string;

  gameId: number;
}

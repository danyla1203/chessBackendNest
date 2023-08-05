import { IsEnum, IsNumber } from 'class-validator';

enum Side {
  White = 'w',
  Black = 'b',
  Random = 'rand',
}

export class CreateGameDto {
  @IsEnum(Side)
  side: 'w' | 'b' | 'rand';

  @IsNumber()
  time: string;

  @IsNumber()
  timeIncrement: string;
}

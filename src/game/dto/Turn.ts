import { IsNumber, IsString, Length } from 'class-validator';

export class TurnBody {
  @IsNumber()
  gameId: number;

  @IsString()
  @Length(1, 5)
  figure: string;

  @IsString()
  @Length(2, 2)
  cell: string;
}

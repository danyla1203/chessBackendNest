import { IsNotEmpty } from 'class-validator';

export class GoogleCode {
  @IsNotEmpty()
  code: string;
}

import { IsNotEmpty } from 'class-validator';

export class UseRefreshDto {
  @IsNotEmpty()
  refreshToken: string;
}

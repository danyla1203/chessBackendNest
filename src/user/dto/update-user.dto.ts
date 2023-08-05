import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  name: string;
}

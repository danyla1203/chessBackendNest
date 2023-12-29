import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsString()
  @Length(5)
  deviceId: string;
}

import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyEmail {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  code: string;
}

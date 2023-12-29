import { IsEmail } from 'class-validator';

export class SendVerificationMail {
  @IsEmail()
  email: string;
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get<string>('SG_API_KEY'));
  }

  private async send(mail: SendGrid.MailDataRequired) {
    const transport = await SendGrid.send(mail);
    console.log(`E-Mail sent to ${mail.to}`);
    return transport;
  }

  async sendVerificationMail(code: number, email: string) {
    const mail = {
      to: email,
      subject: 'Verify your account',
      from: 'zelenko.d.work@gmail.com',
      text: 'Hello',
      html: `<h1>Code: ${code}</h1>`,
    };

    return await this.send(mail);
  }
}

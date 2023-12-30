import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { PaymentsModule } from './payments/payments.module';
import { UserModule } from './user/user.module';
import { MailService } from './mail/mail.service';
import { LoggerModule } from './tools/logger';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    AuthModule,
    GameModule,
    PaymentsModule,
    UserModule,
  ],
  controllers: [],
  providers: [MailService],
})
export class AppModule {}

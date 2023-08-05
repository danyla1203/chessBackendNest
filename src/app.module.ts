import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { PaymentsModule } from './payments/payments.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, GameModule, PaymentsModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

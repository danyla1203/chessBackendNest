import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [AuthModule, GameModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

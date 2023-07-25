import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameList } from './game.list';
import { GameService } from './game.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [GameGateway, GameList, GameService],
})
export class GameModule {}

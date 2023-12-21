import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameList } from './game.list';
import { GameService } from './game.service';
import { GameModel } from './model';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [],
  providers: [GameGateway, GameList, GameService, PrismaService, GameModel],
})
export class GameModule {}

import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameList } from './game.list';
import { GameService } from './game.service';
import { AuthModule } from 'src/auth/auth.module';
import { GameModel } from './model';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [AuthModule],
  providers: [GameGateway, GameList, GameService, PrismaService, GameModel],
})
export class GameModule {}

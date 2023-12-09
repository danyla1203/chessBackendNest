import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DrawGame, GameWithWinner } from './entities/game';
import { Game, Prisma } from '@prisma/client';

@Injectable()
export class GameModel {
  constructor(private readonly prisma: PrismaService) {}

  public saveDraw({ config, pl1, pl2, moves }: DrawGame): Promise<Game> {
    const jsonMoves = moves as unknown as Prisma.JsonArray;
    return this.prisma.game.create({
      data: {
        isDraw: true,
        maxTime: config.time,
        timeIncrement: config.timeIncrement,
        sideSelecting: config.side,
        moves: jsonMoves,
        players: {
          create: [
            {
              userId: pl1.userId,
              side: pl1.side,
              isWinner: false,
            },
            {
              userId: pl2.userId,
              side: pl2.side,
              isWinner: false,
            },
          ],
        },
      },
    });
  }
  public saveGameWithWinner({
    config,
    winner,
    looser,
    moves,
  }: GameWithWinner): Promise<Game> {
    const jsonMoves = moves as unknown as Prisma.JsonArray;
    return this.prisma.game.create({
      data: {
        isDraw: false,
        maxTime: config.time,
        timeIncrement: config.timeIncrement,
        sideSelecting: config.side,
        moves: jsonMoves,
        players: {
          create: [
            {
              userId: winner.userId,
              side: winner.side,
              isWinner: true,
            },
            {
              userId: looser.userId,
              side: looser.side,
              isWinner: false,
            },
          ],
        },
      },
    });
  }
}

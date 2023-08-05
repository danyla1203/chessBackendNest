import { ConflictException } from '@nestjs/common';
import { CompletedMove } from '../dto';
import { GameProcess } from '../process/game.process';
import { Client } from './Client';
import { Player } from './Player';
import { Cell, Figure, FiguresCellState } from './game.entities';
import { time } from 'console';

type Config = {
  side: 'w' | 'b' | 'rand';
  time: number;
  timeIncrement: number;
};
type GameData = {
  id: number;
  players: { [k: string]: Player };
  config: Config;
};

export class Game {
  id: number;
  players: { [k: string]: Player };
  config: Config;
  isActive: boolean;
  process: GameProcess = new GameProcess();

  getGameData(): GameData {
    return {
      id: this.id,
      players: this.players,
      config: this.config,
    };
  }
  getActualState(): FiguresCellState {
    return this.process.state;
  }
  getInitedGameData(userId: string) {
    const { white, black } = this.getActualState();
    const boards = {
      white: Object.fromEntries(white),
      black: Object.fromEntries(black),
    };

    const payload: any = {
      board: boards,
      gameId: this.id,
      side: this.players[userId].side,
      maxTime: this.config.time,
      timeIncrement: this.config.timeIncrement,
    };
    return payload;
  }

  constructor(player: Client, config: Config) {
    this.id = Math.floor(Math.random() * 100000);

    const side: 'w' | 'b' =
      config.side === 'rand' ? (Math.random() > 0.5 ? 'w' : 'b') : config.side;

    this.players = {
      [player.id]: { ...player, side, time: config.time },
    };
    this.config = config;
    this.isActive = false;
  }

  addPlayer(player: Client) {
    const pickedSide = Object.values(this.players)[0].side;
    const side = pickedSide === 'w' ? 'b' : 'w';
    this.players[player.id] = { ...player, side, time: this.config.time };
  }

  makeTurn(playerId: string, figure: Figure, cell: Cell): CompletedMove {
    const turnSide = this.process.turnSide;
    const player = this.players[playerId];

    if (player.side !== turnSide) {
      throw new ConflictException('Not your turn');
    }
    const turnResult = this.process.makeTurn(figure, cell);

    clearInterval(player.intervalLabel);
    player.time += this.config.timeIncrement;

    const nextPlayer = Object.values(this.players).find(
      (player) => player.id !== playerId,
    );
    nextPlayer.intervalLabel = setInterval(() => {
      nextPlayer.time -= 1000;
      nextPlayer.emit('game:time', nextPlayer.time);
      player.emit('game:time', '0');
    }, 1000);

    this.process.store.setNextTurnSide();
    return turnResult;
  }

  start() {
    this.isActive = true;
    const whitePlayer = Object.values(this.players).find(
      (player) => player.side === 'w',
    );
    const blackPlayer = Object.values(this.players).find(
      (player) => player.side === 'b',
    );

    whitePlayer.intervalLabel = setInterval(() => {
      whitePlayer.time -= 1000;
      whitePlayer.emit('game:time', whitePlayer.time);
      blackPlayer.emit('game:time', '0');
    }, 1000);
  }
}

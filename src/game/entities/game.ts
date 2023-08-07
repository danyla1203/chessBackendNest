import { ConflictException } from '@nestjs/common';
import { CompletedMove } from '../dto';
import { GameProcess } from '../process/game.process';
import { Client } from './Client';
import { Player } from './Player';
import { Cell, Figure, FiguresCellState } from './game.entities';

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

  endGame(winner: Player, looser: Player) {
    clearInterval(winner.intervalLabel);
    clearInterval(looser.intervalLabel);
    this.isActive = false;
    winner.emit('game:end', { winner: true });
    looser.emit('game:end', { winner: false });
  }

  changeTickingSide(next: Player, old: Player) {
    clearInterval(old.intervalLabel);

    const white = next.side === 'w' ? next : old;
    const black = next.side === 'b' ? next : old;

    old.time += this.config.timeIncrement;
    old.emit('game:time', { w: white.time, b: black.time });

    next.intervalLabel = setInterval(() => {
      next.time -= 1000;
      if (next.time <= 0) {
        this.endGame(old, next);
      }
      next.emit('game:time', { w: white.time, b: black.time });
      old.emit('game:time', { w: white.time, b: black.time });
    }, 1000);
  }

  makeTurn(playerId: string, figure: Figure, cell: Cell): CompletedMove {
    if (!this.isActive) throw new ConflictException('Game is inactive');

    const turnSide = this.process.turnSide;
    const player = this.players[playerId];

    if (player.side !== turnSide) {
      throw new ConflictException('Not your turn');
    }
    const turnResult = this.process.makeTurn(figure, cell);

    const nextPlayer = Object.values(this.players).find(
      (player) => player.id !== playerId,
    );
    this.changeTickingSide(nextPlayer, player);

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
    blackPlayer.time -= this.config.timeIncrement;
    this.changeTickingSide(whitePlayer, blackPlayer);
  }
}

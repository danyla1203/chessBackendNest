import { ConflictException } from '@nestjs/common';
import { CompletedMove, InitedGameData } from '../../dto';
import { GameProcess } from './process/game.process';
import { Client } from '../Client';
import { Player } from '../Player';
import {
  Cell,
  Config,
  DrawGame,
  Figure,
  GameData,
  GameWithWinner,
  Move,
} from './game.types';
import { GameChat } from './game.chat';

export class Game {
  id: number;
  isActive = false;
  players: Player[];
  config: Config;
  process: GameProcess = new GameProcess();
  chat: GameChat = new GameChat();
  moves: Move[] = [];
  winner: null | Player = null;
  looser: null | Player = null;
  draw: {
    w: boolean;
    b: boolean;
  } = { w: false, b: false };
  saveDraw: (pl1: Player, pl2: Player, drawData: DrawGame) => Promise<void>;
  saveGameWithWinner: (
    winner: Player,
    looser: Player,
    winnerData: GameWithWinner,
  ) => Promise<void>;

  public get data(): GameData {
    return {
      id: this.id,
      players: this.players,
      config: this.config,
    };
  }

  public getInitedGameData(userId: string): InitedGameData {
    const { white, black } = this.process.state;
    const boards = {
      white: Object.fromEntries(white),
      black: Object.fromEntries(black),
    };

    const payload = {
      board: boards,
      gameId: this.id,
      side: this.players.find((pl) => pl.id === userId).side,
      maxTime: this.config.time,
      timeIncrement: this.config.timeIncrement,
    };
    return payload;
  }

  constructor(player: Client, config: Config, saveDraw, saveGameWithWinner) {
    this.saveDraw = saveDraw;
    this.saveGameWithWinner = saveGameWithWinner;
    this.id = Math.floor(Math.random() * 100000);

    const side: 'w' | 'b' =
      config.side === 'rand' ? (Math.random() > 0.5 ? 'w' : 'b') : config.side;

    this.players = [{ ...player, side, time: config.time }];
    this.config = config;
  }

  public addPlayer(player: Client): void {
    const pickedSide = Object.values(this.players)[0].side;
    const side = pickedSide === 'w' ? 'b' : 'w';
    this.players.push({ ...player, side, time: this.config.time });
  }

  public async endGame(winner: Player, looser: Player): Promise<void> {
    clearInterval(winner.intervalLabel);
    clearInterval(looser.intervalLabel);
    this.isActive = false;
    this.winner = winner;
    this.looser = looser;
    winner.emit('game:end', { winner: true });
    looser.emit('game:end', { winner: false });

    const winnerData = {
      id: this.id,
      moves: this.moves,
      config: this.config,
      winner,
      looser,
    };

    await this.saveGameWithWinner(winner, looser, winnerData);
  }
  public async endGameByDraw(): Promise<void> {
    const [pl1, pl2] = Object.values(this.players);
    clearInterval(pl1.intervalLabel);
    clearInterval(pl2.intervalLabel);
    this.isActive = false;

    const drawData = {
      id: this.id,
      config: this.config,
      moves: this.moves,
      pl1,
      pl2,
    };

    await this.saveDraw(pl1, pl2, drawData);
  }
  public setDrawPurposeFrom({ side }: Player): void {
    this.draw[side] = true;
  }
  public rejectDraw(): void {
    this.draw = { w: false, b: false };
  }

  public addTimeTo(target: Player, inc): void {
    this.players[target.id].time += inc;
  }

  public changeTickingSide(next: Player, old: Player): void {
    clearInterval(old.intervalLabel);

    const white = next.side === 'w' ? next : old;
    const black = next.side === 'b' ? next : old;

    old.time += this.config.timeIncrement;
    old.emit('game:time', { w: white.time, b: black.time });

    next.intervalLabel = setInterval(async () => {
      next.time -= 1000;
      if (next.time <= 0) {
        await this.endGame(old, next);
      }
      next.emit('game:time', { w: white.time, b: black.time });
      old.emit('game:time', { w: white.time, b: black.time });
    }, 1000);
  }

  private saveMove(
    figure: Figure,
    to: Cell,
    from: Cell,
    completedMove: CompletedMove,
  ): void {
    this.moves.push({
      side: this.process.turnSide,
      figure,
      from,
      to,
      ...completedMove,
    });
  }

  public makeTurn(playerId: string, figure: Figure, cell: Cell): CompletedMove {
    if (!this.isActive) throw new ConflictException('Game is inactive');

    const turnSide = this.process.turnSide;
    const player =
      this.players[0].id === playerId ? this.players[0] : this.players[1];

    if (player.side !== turnSide) {
      throw new ConflictException('Not your turn');
    }
    const from: Cell = this.process.board.board.get(figure);
    const turnResult = this.process.makeTurn(figure, cell);

    const nextPlayer = this.players.find((player) => player.id !== playerId);
    this.changeTickingSide(nextPlayer, player);

    this.saveMove(figure, cell, from, turnResult);
    this.process.store.setNextTurnSide();
    return turnResult;
  }

  public start(): void {
    this.isActive = true;
    const whitePlayer = this.players.find((player) => player.side === 'w');
    const blackPlayer = this.players.find((player) => player.side === 'b');
    blackPlayer.time -= this.config.timeIncrement;
    this.changeTickingSide(whitePlayer, blackPlayer);
  }
}

import { ConflictException } from '@nestjs/common';
import { CompletedMove, InitedGameData } from '../../dto';
import { GameProcess } from './process/game.process';
import { Client } from '../Client';
import { Player } from '../Player';
import {
  Cell,
  Config,
  Figure,
  FiguresCellState,
  GameData,
  GameWithWinner,
  Move,
  DrawGame,
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
  endGameByTimeoutCb: (
    game: GameWithWinner | DrawGame,
    winer: Player,
    looser: Player,
  ) => void;
  timerTickCb: (time: { w: number; b: number }) => void;

  public get data(): GameData {
    return {
      id: this.id,
      players: this.players,
      config: this.config,
    };
  }
  private gameResultDto(
    winner: Player,
    looser: Player,
    draw = false,
  ): GameWithWinner | DrawGame {
    delete winner.intervalLabel;
    delete looser.intervalLabel;
    const base = {
      id: this.id,
      moves: this.moves,
      config: this.config,
    };
    return draw
      ? { ...base, pl1: winner, pl2: looser }
      : { ...base, winner, looser };
  }
  public getInitedGameData(userId: number): InitedGameData {
    const boards: FiguresCellState = this.process.state;

    const plainObj = {
      w: {},
      b: {},
    };

    const [white, black] = Object.values(boards);
    for (const [figure, cell] of white.entries()) {
      plainObj.w[cell] = figure;
    }
    for (const [figure, cell] of black.entries()) {
      plainObj.b[cell] = figure;
    }

    const payload = {
      board: plainObj,
      gameId: this.id,
      side: this.players.find((pl) => pl.userId === userId).side,
      maxTime: this.config.time,
      timeIncrement: this.config.timeIncrement,
    };
    return payload;
  }

  constructor(player: Client, config: Config, gameEndCallback, timerTickCb) {
    this.endGameByTimeoutCb = gameEndCallback;
    this.timerTickCb = (time) => timerTickCb(this.players, time);
    this.id = Math.floor(Math.random() * 100000);

    const side: 'w' | 'b' =
      config.side === 'rand' ? (Math.random() > 0.5 ? 'w' : 'b') : config.side;

    this.players = [{ ...player, side, time: config.time }];
    this.config = config;
  }

  public addPlayer(client: Client): Player {
    const pickedSide = Object.values(this.players)[0].side;
    const side = pickedSide === 'w' ? 'b' : 'w';
    const player: Player = { ...client, side, time: this.config.time };
    this.players.push(player);
    return player;
  }

  public endGame(winner: Player, looser: Player): GameWithWinner {
    clearInterval(winner.intervalLabel);
    clearInterval(looser.intervalLabel);
    this.isActive = false;
    this.winner = winner;
    this.looser = looser;
    return this.gameResultDto(winner, looser) as GameWithWinner;
  }
  public endGameByDraw(): DrawGame {
    const [pl1, pl2] = Object.values(this.players);
    clearInterval(pl1.intervalLabel);
    clearInterval(pl2.intervalLabel);
    this.isActive = false;
    return this.gameResultDto(pl1, pl2, true) as DrawGame;
  }
  public setDrawPurposeFrom(side: 'w' | 'b'): void {
    this.draw[side] = true;
  }
  public rejectDraw(): void {
    this.draw = { w: false, b: false };
  }

  public addTimeTo(target: Player, inc): void {
    const pl = this.players.find((player) => player.userId === target.userId);
    pl.time += inc;
  }

  public async timerTick(active: Player, waiter: Player) {
    const white = active.side === 'w' ? active : waiter;
    const black = active.side === 'b' ? active : waiter;
    active.time -= 1000;
    if (active.time <= 0) {
      const game = this.endGame(waiter, active);
      this.endGameByTimeoutCb(game, waiter, active);
    }
    this.timerTickCb({ w: white.time, b: black.time });
  }
  public changeTickingSide(next: Player, old: Player): void {
    clearInterval(old.intervalLabel);
    old.turningPlayer = false;
    old.time += this.config.timeIncrement;

    next.turningPlayer = true;
    next.intervalLabel = setInterval(() => {
      this.timerTick.call(this, next, old);
    }, 1000);
  }
  public resetTicking() {
    const [pl1, pl2] = this.players;
    clearInterval(pl1.intervalLabel);
    clearInterval(pl2.intervalLabel);
    const { active, waiter } = pl1.turningPlayer
      ? { active: pl1, waiter: pl2 }
      : { active: pl2, waiter: pl1 };
    active.intervalLabel = setInterval(() => {
      this.timerTick.call(this, active, waiter);
    }, 1000);
  }
  public resetPlayer(newSocket: Client): Player {
    const prev = this.players.find((pl) => newSocket.userId === pl.userId);
    clearInterval(prev.intervalLabel);
    this.players = this.players.filter((pl) => pl.userId !== newSocket.userId);
    const newPlayer: Player = {
      ...newSocket,
      time: prev.time,
      side: prev.side,
    };
    this.players.push(newPlayer);
    return newPlayer;
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

  public makeTurn(
    playerId: number,
    figure: Figure,
    cell: Cell,
  ): { result: CompletedMove; prevCell: Cell; side: 'w' | 'b' } {
    if (!this.isActive) throw new ConflictException('Game is not active');

    const player = this.players.find(({ userId }) => playerId === userId);
    if (player.side !== this.process.turnSide) {
      throw new ConflictException('Not your turn');
    }

    const from: Cell = this.process.getBoard().board.get(figure);
    const result = this.process.makeTurn(figure, cell);

    const nextPlayer = this.players.find(
      (player) => player.userId !== playerId,
    );
    this.changeTickingSide(nextPlayer, player);

    this.saveMove(figure, cell, from, result);
    this.process.store.setNextTurnSide();
    return { result, prevCell: from, side: player.side };
  }

  public start(): void {
    this.isActive = true;
    const whitePlayer = this.players.find((player) => player.side === 'w');
    const blackPlayer = this.players.find((player) => player.side === 'b');
    blackPlayer.time -= this.config.timeIncrement;
    this.changeTickingSide(whitePlayer, blackPlayer);
  }
}

import { ConflictException } from '@nestjs/common';
import { CompletedMove, MateData, ShahData, StrikedData } from '../dto';
import { GameProcess } from '../process/game.process';
import { Client } from './Client';
import { Player } from './Player';
import { Cell, Figure, FiguresCellState } from './game.entities';
import { GameChat } from './game.chat';

export type Config = {
  side: 'w' | 'b' | 'rand';
  time: number;
  timeIncrement: number;
};

export type GameData = {
  id: number;
  players: { [k: string]: Player };
  config: Config;
};
type GameResult = {
  id: number;
  config: Config;
  moves: Move[];
};
export type GameWithWinner = GameResult & {
  winner: Player;
  looser: Player;
};
export type DrawGame = GameResult & {
  pl1: Player;
  pl2: Player;
};

export type Move = {
  side: 'w' | 'b';
  figure: Figure;
  from: Cell;
  to: Cell;
  strikedData?: StrikedData;
  shahData?: ShahData;
  mateData?: MateData;
};

export class Game {
  id: number;
  isActive = false;
  players: { [k: string]: Player };
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

  getGameData(): GameData {
    return {
      id: this.id,
      players: this.players,
      config: this.config,
    };
  }

  getDrawData(): DrawGame {
    const players = Object.values(this.players);
    return {
      id: this.id,
      config: this.config,
      moves: this.moves,
      pl1: players[0],
      pl2: players[1],
    };
  }
  getWinnerData(): GameWithWinner {
    return {
      id: this.id,
      moves: this.moves,
      config: this.config,
      winner: this.winner,
      looser: this.looser,
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

  constructor(player: Client, config: Config, saveDraw, saveGameWithWinner) {
    this.saveDraw = saveDraw;
    this.saveGameWithWinner = saveGameWithWinner;
    this.id = Math.floor(Math.random() * 100000);

    const side: 'w' | 'b' =
      config.side === 'rand' ? (Math.random() > 0.5 ? 'w' : 'b') : config.side;

    this.players = {
      [player.id]: { ...player, side, time: config.time },
    };
    this.config = config;
  }

  addPlayer(player: Client) {
    const pickedSide = Object.values(this.players)[0].side;
    const side = pickedSide === 'w' ? 'b' : 'w';
    this.players[player.id] = { ...player, side, time: this.config.time };
  }

  async endGame(winner: Player, looser: Player) {
    clearInterval(winner.intervalLabel);
    clearInterval(looser.intervalLabel);
    this.isActive = false;
    this.winner = winner;
    this.looser = looser;
    winner.emit('game:end', { winner: true });
    looser.emit('game:end', { winner: false });
    await this.saveGameWithWinner(winner, looser, this.getWinnerData());
  }
  async endGameByDraw() {
    const [pl1, pl2] = Object.values(this.players);
    clearInterval(pl1.intervalLabel);
    clearInterval(pl2.intervalLabel);
    this.isActive = false;
    await this.saveDraw(pl1, pl2, this.getDrawData());
  }
  setDrawPurpose({ side }: Player) {
    this.draw[side] = true;
  }
  rejectDraw() {
    this.draw = { w: false, b: false };
  }

  addTime(target: Player, inc) {
    this.players[target.id].time += inc;
  }

  changeTickingSide(next: Player, old: Player) {
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
  ) {
    this.moves.push({
      side: this.process.turnSide,
      figure,
      from,
      to,
      ...completedMove,
    });
  }

  makeTurn(playerId: string, figure: Figure, cell: Cell): CompletedMove {
    if (!this.isActive) throw new ConflictException('Game is inactive');

    const turnSide = this.process.turnSide;
    const player = this.players[playerId];

    if (player.side !== turnSide) {
      throw new ConflictException('Not your turn');
    }
    const from: Cell = this.process.board.board.get(figure);
    const turnResult = this.process.makeTurn(figure, cell);

    const nextPlayer = Object.values(this.players).find(
      (player) => player.id !== playerId,
    );
    this.changeTickingSide(nextPlayer, player);

    this.saveMove(figure, cell, from, turnResult);
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

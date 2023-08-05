import { FiguresCellState } from '../entities/game.entities';
import { GameState } from './game.state';

export class GameProcess {
  store: GameState;

  initBoard(): FiguresCellState {
    const black = {
      pawn1: 'a7',
      pawn2: 'b7',
      pawn3: 'c7',
      pawn4: 'd7',
      pawn5: 'e7',
      pawn6: 'f7',
      pawn7: 'g7',
      pawn8: 'h7',
      R1: 'a8',
      B1: 'c8',
      K1: 'b8',
      Q: 'd8',
      Kn: 'e8',
      K2: 'g8',
      B2: 'f8',
      R2: 'h8',
    };
    const white = {
      pawn1: 'a2',
      pawn2: 'b2',
      pawn3: 'c2',
      pawn4: 'd2',
      pawn5: 'e2',
      pawn6: 'f2',
      pawn7: 'g2',
      pawn8: 'h2',
      R1: 'a1',
      B1: 'c1',
      K1: 'b1',
      Q: 'd1',
      Kn: 'e1',
      K2: 'g1',
      B2: 'f1',
      R2: 'h1',
    };
    return {
      white: new Map(Object.entries(white)),
      black: new Map(Object.entries(black)),
    };
  }

  constructor() {
    const { white, black } = this.initBoard();
    this.store = new GameState(white, black);
  }

  state(): FiguresCellState {
    return {
      white: this.store.getWhite(),
      black: this.store.getBlack(),
    };
  }
}

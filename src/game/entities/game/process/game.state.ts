import { ShahData } from '../../../dto';
import { Figures, Figure, Cell, FiguresSet } from '..';

export class GameState {
  blackBoard: Figures;
  whiteBoard: Figures;
  shahData: null | ShahData;
  possibleShahes: FiguresSet;
  strikeAroundKn: FiguresSet;

  sideToTurn: 'w' | 'b';

  constructor(white: Figures, black: Figures) {
    this.blackBoard = black;
    this.whiteBoard = white;
    this.sideToTurn = 'w';
    this.possibleShahes = { w: new Set(), b: new Set() };
    this.strikeAroundKn = { w: new Set(), b: new Set() };
    this.shahData = null;
  }

  public updateBoard(figure: Figure, cell: Cell): void {
    this.sideToTurn == 'w'
      ? this.whiteBoard.set(figure, cell)
      : this.blackBoard.set(figure, cell);
  }

  public removeShah(): void {
    this.shahData = null;
  }

  public getBlack(): Figures {
    return new Map(this.blackBoard);
  }
  public getWhite(): Figures {
    return new Map(this.whiteBoard);
  }
  get state() {
    return { w: this.getWhite(), b: this.getBlack() };
  }
  get side() {
    return this.sideToTurn;
  }
  setNextTurnSide() {
    this.sideToTurn = this.sideToTurn == 'w' ? 'b' : 'w';
  }
  set turnSide(side: 'w' | 'b') {
    this.sideToTurn = side;
  }
  get shah() {
    return this.shahData ? { ...this.shahData } : null;
  }

  public setShahData(toSide: 'w' | 'b', byFigure: Figure): void {
    this.shahData = {
      shachedSide: toSide,
      byFigure,
    };
  }
  public removePossibleShah(forSide: 'w' | 'b', figure: Figure): void {
    this.possibleShahes[forSide].delete(figure);
  }
  public getPossibleShahes(side: 'w' | 'b'): Set<Figure> {
    return new Set(this.possibleShahes[side]);
  }
  public getStrikeAroundKn(): FiguresSet {
    return this.strikeAroundKn;
  }
  public setPossibleShah(side: 'w' | 'b', figure: Figure): void {
    this.possibleShahes[side].add(figure);
  }
  public setStrikeAroundKn(side: 'w' | 'b', figure: Figure): void {
    this.strikeAroundKn[side].add(figure);
  }
  public removeFigure(side: 'w' | 'b', figure: Figure): void {
    if (side === 'w') {
      this.whiteBoard.delete(figure);
      this.possibleShahes['b'].delete(figure);
      this.strikeAroundKn['b'].delete(figure);
    } else {
      this.blackBoard.delete(figure);
      this.possibleShahes['w'].delete(figure);
      this.strikeAroundKn['w'].delete(figure);
    }
  }
}

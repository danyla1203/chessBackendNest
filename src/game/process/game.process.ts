import { ConflictException } from '@nestjs/common';
import { Figures, FiguresCellState, Cell, Figure, Board } from '../entities';
import { GameState } from './game.state';
import { CellUpdate } from '../entities/game.entities';
import { CompletedMove, MateData, ShahData, StrikedData } from '../dto';

export class GameProcess {
  store: GameState;
  Letters: string[];

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

  get state(): FiguresCellState {
    return {
      white: this.store.getWhite(),
      black: this.store.getBlack(),
    };
  }
  get turnSide(): 'w' | 'b' {
    return this.store.side;
  }

  get board(): Board {
    const side = this.store.side;
    const state = this.store.state;
    let board, opponent;
    if (side == 'w') {
      board = state.w;
      opponent = state.b;
    } else {
      board = state.b;
      opponent = state.w;
    }
    return { board, opponent };
  }

  set moveSide(side: 'w' | 'b') {
    this.store.side = side;
  }

  removeShah(): void {
    this.store.removeShah();
  }
  removeFigure(turnSide: 'w' | 'b', figure: Figure): void {
    this.store.removeFigure(turnSide, figure);
  }

  updateBoard(figure: Figure, cell: Cell): void {
    this.store.updateBoard(figure, cell);
  }

  getOpponentSide(): 'w' | 'b' {
    return this.store.side == 'w' ? 'b' : 'w';
  }

  constructor() {
    const { white, black } = this.initBoard();
    this.store = new GameState(white, black);
    this.Letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  }
  findNextLetter(center: string): string[] {
    const result = [];
    for (let i = 0; i < this.Letters.length; i++) {
      if (this.Letters[i] == center) {
        if (this.Letters[i - 1]) {
          result.push(this.Letters[i - 1]);
        }
        if (this.Letters[i + 1]) {
          result.push(this.Letters[i + 1]);
        }
      }
    }
    return result;
  }
  checkIsCellEmpty(board: Board, newCell: string): boolean {
    if (parseInt(newCell[1], 10) > 8) return false;
    for (const [figure] of board.board) {
      if (board.board.get(figure) === newCell) return false;
    }
    for (const [figure] of board.opponent) {
      if (board.opponent.get(figure) === newCell) return false;
    }
    return true;
  }
  isEnemyInCell(opponent: Figures, cell: Cell): boolean {
    for (const [figure] of opponent) {
      if (opponent.get(figure) === cell) return true;
    }
    return false;
  }
  getEmptyCellsAroundKn(board: Board, knCell: Cell): Cell[] {
    return this.getCellsAround(knCell).filter((cell: Cell) => {
      return (
        this.checkIsCellEmpty(board, cell) ||
        this.isEnemyInCell(board.opponent, cell)
      );
    });
  }
  getCellsAround(center: Cell): Cell[] {
    const [letter, number] = center;
    const [leftLetter, rightLetter] = this.findNextLetter(letter);
    const nextNum = parseInt(number, 10) + 1;
    const prevNum = parseInt(number, 10) - 1;
    const result: Cell[] = [
      `${letter}${nextNum}`,
      `${letter}${prevNum}`,
      `${rightLetter}${nextNum}`,
      `${rightLetter}${prevNum}`,
      `${leftLetter}${nextNum}`,
      `${leftLetter}${prevNum}`,
      `${leftLetter}${number}`,
      `${rightLetter}${number}`,
    ];
    return result.filter(
      (cell) =>
        parseInt(cell[1]) <= 8 && parseInt(cell[1]) >= 1 && cell.length === 2,
    );
  }
  getEmptyCellsBetween(knCell: Cell, cell: Cell) {
    const num1 = parseInt(cell[1]);
    const num2 = parseInt(knCell[1]);
    const index1 = this.Letters.findIndex((lett) => lett == cell[0]);
    const index2 = this.Letters.findIndex((lett) => lett === knCell[0]);
    const possibleMoves: string[] = [];

    let indexChange = 0;
    if (index2 > index1) {
      indexChange = 1;
    } else if (index2 < index1) {
      indexChange = -1;
    }
    let numChange = 0;
    if (num2 > num1) {
      numChange = 1;
    } else if (num2 < num1) {
      numChange = -1;
    }

    for (
      let i = index1 + indexChange, nextNum = num1 + numChange;
      i !== index2 || nextNum !== num2;
      i += indexChange, nextNum += numChange
    ) {
      possibleMoves.push(`${this.Letters[i]}${nextNum}`);
    }
    return possibleMoves;
  }

  canRockMove(board: Board, cells: CellUpdate): boolean {
    const { newCell, prevCell } = cells;
    const [prevLetter, num] = prevCell;
    const prevNum = parseInt(num, 10);
    for (let i = prevNum + 1; i < 9; i++) {
      const cell = `${prevLetter}${i}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }
    for (let i = prevNum - 1; i > 0; i--) {
      const cell = `${prevLetter}${i}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }

    const letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);
    for (let i = letterIndex + 1; i < this.Letters.length; i++) {
      const cell = `${this.Letters[i]}${prevNum}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      const cell = `${this.Letters[i]}${prevNum}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }
    return false;
  }
  canPawnMove(board: Board, { newCell, prevCell }: CellUpdate): boolean {
    const sideToMove = this.store.side === 'w' ? 1 : -1;

    const [prevLetter, prevNumber] = prevCell;
    const prevNum = parseInt(prevNumber, 10);
    const nextLetters = this.findNextLetter(prevLetter);
    const possibleNextNum = prevNum + sideToMove;

    const possibleNextCell = `${prevLetter}${possibleNextNum}`;
    const possibleNextDiagonalCell1 = `${nextLetters[0]}${possibleNextNum}`;
    const possibleNextDiagonalCell2 = `${nextLetters[1]}${possibleNextNum}`;

    if (possibleNextCell === newCell && this.checkIsCellEmpty(board, newCell)) {
      return true;
    }
    if (
      possibleNextDiagonalCell1 === newCell &&
      this.isEnemyInCell(board.opponent, newCell)
    ) {
      return true;
    }
    if (
      possibleNextDiagonalCell2 === newCell &&
      this.isEnemyInCell(board.opponent, newCell)
    ) {
      return true;
    }

    let cell;
    let pathCell;
    if (this.store.side === 'w' && prevNum == 2) {
      cell = `${prevLetter}${prevNum + 2}`;
      pathCell = `${prevLetter}${prevNum + 1}`;
    } else if (this.store.side === 'b' && prevNum == 7) {
      cell = `${prevLetter}${prevNum - 2}`;
      pathCell = `${prevLetter}${prevNum - 1}`;
    }

    return (
      newCell === cell &&
      this.checkIsCellEmpty(board, cell) &&
      this.checkIsCellEmpty(board, pathCell)
    );
  }
  canQueenMove(board: Board, cells: CellUpdate): boolean {
    return this.canBishopMove(board, cells) || this.canRockMove(board, cells);
  }
  canKnMove(board: Board, { prevCell, newCell }: CellUpdate): boolean {
    const possibleMoves = this.getEmptyCellsAroundKn(board, prevCell);
    for (const cell of possibleMoves) {
      if (cell === newCell) return true;
    }
    return false;
  }
  canKnightMove(board: Board, { newCell, prevCell }: CellUpdate): boolean {
    const [prevLetter, prevNum] = prevCell;
    const num = parseInt(prevNum, 10);
    const nextLetters = this.findNextLetter(prevLetter);
    const nextLetterRight = this.findNextLetter(nextLetters[1])[1];
    let nextLetterLeft = this.findNextLetter(nextLetters[0])[0];
    nextLetterLeft = nextLetterLeft == prevLetter ? null : nextLetterLeft;

    const possibleCells: Cell[] = [
      `${nextLetters[1]}${num + 2}`,
      `${nextLetterRight}${num + 1}`,
      `${nextLetterRight}${num - 1}`,
      `${nextLetters[1]}${num - 2}`,
      `${nextLetters[0]}${num - 2}`,
      `${nextLetterLeft}${num - 1}`,
      `${nextLetterLeft}${num + 1}`,
      `${nextLetters[0]}${num + 2}`,
    ];
    for (let i = 0; i < possibleCells.length; i++) {
      if (newCell === possibleCells[i]) {
        return (
          this.isEnemyInCell(board.opponent, newCell) ||
          this.checkIsCellEmpty(board, newCell)
        );
      }
    }
  }
  canBishopMove(board: Board, cells: CellUpdate): boolean {
    const { newCell, prevCell } = cells;
    const [prevLetter, num] = prevCell;
    const prevNum = parseInt(num, 10);
    const letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);

    for (
      let i = letterIndex + 1, nextNum = prevNum + 1;
      i < this.Letters.length;
      i++, nextNum++
    ) {
      if (nextNum > 8) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }
    for (
      let i = letterIndex - 1, nextNum = prevNum - 1;
      i >= 0;
      i--, nextNum--
    ) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }
    for (
      let i = letterIndex + 1, nextNum = prevNum - 1;
      i < this.Letters.length;
      i++, nextNum--
    ) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }
    for (
      let i = letterIndex - 1, nextNum = prevNum + 1;
      i >= 0;
      i--, nextNum++
    ) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      const isCellEmpty = this.checkIsCellEmpty(board, cell);
      const isEnemyInCell = this.isEnemyInCell(board.opponent, cell);
      const isCellFound = newCell === cell;

      if (isCellFound) {
        return isCellEmpty || isEnemyInCell;
      }
      if (!isCellEmpty) break;
    }
    return false;
  }

  verifyFigureMove(
    figures: Figures,
    enemyFigures: Figures,
    figure: Figure,
    cell: Cell,
  ): boolean {
    const board: Board = {
      board: figures,
      opponent: enemyFigures,
    };
    const cells: CellUpdate = {
      prevCell: figures.get(figure),
      newCell: cell,
    };
    if (/pawn/.test(figure)) {
      return this.canPawnMove(board, cells);
    } else if (/R/.test(figure)) {
      return this.canRockMove(board, cells);
    } else if (/Kn/.test(figure)) {
      return this.canKnMove(board, cells);
    } else if (/B/.test(figure)) {
      return this.canBishopMove(board, cells);
    } else if (/Q/.test(figure)) {
      return this.canQueenMove(board, cells);
    } else if (/K/.test(figure)) {
      return this.canKnightMove(board, cells);
    }
  }

  isStrikeAfterMove(cell: Cell): null | StrikedData {
    const { opponent } = this.board;
    const opSide = this.getOpponentSide();
    for (const [figure, fCell] of opponent) {
      if (fCell === cell) return { strikedSide: opSide, figure };
    }
  }
  isShahRemainsAfterMove(figure: Figure, cell: Cell): boolean {
    const shah = this.store.shah;
    if (!shah) return false;
    if (this.store.shah.shachedSide !== this.store.side) return false;
    const { board, opponent } = this.board;
    let knCell = board.get('Kn');

    const strike: null | StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      if (strike.figure === shah.byFigure) return false;
    }

    board.set(figure, cell);
    if (figure === 'Kn') knCell = cell;

    this.store.setNextTurnSide();
    if (this.verifyFigureMove(opponent, board, shah.byFigure, knCell)) {
      this.store.setNextTurnSide();
      return true;
    }
    this.store.setNextTurnSide();
    return false;
  }
  isShahAppearsAfterMove(figure: Figure, cell: Cell): boolean {
    const possibleShahes = this.store.getPossibleShahes(this.store.side);
    const { board, opponent } = this.board;
    let knCell = board.get('Kn');

    const strike: null | StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      possibleShahes.delete(strike.figure);
    }

    board.set(figure, cell);
    if (figure === 'Kn') knCell = cell;
    this.store.setNextTurnSide();

    for (const opponentFigure of possibleShahes) {
      if (this.verifyFigureMove(opponent, board, opponentFigure, knCell)) {
        this.store.setNextTurnSide();
        return true;
      }
    }
    this.store.setNextTurnSide();
    return false;
  }
  setPossibleShah(figure: Figure, cell: Cell): void {
    const enemyKnCell: Cell = this.board.opponent.get('Kn');
    const opponent: Figures = new Map();
    const board: Figures = new Map();
    opponent.set('Kn', enemyKnCell);
    board.set(figure, cell);

    if (this.verifyFigureMove(board, opponent, figure, enemyKnCell)) {
      this.store.setPossibleShah(this.getOpponentSide(), figure);
    }
  }
  setFigureStrikeAroundKn(figure: Figure, cell: Cell) {
    const enemyKnCell: Cell = this.board.opponent.get('Kn');
    const opponent: Figures = new Map();
    const board: Figures = new Map();
    opponent.set('Kn', enemyKnCell);
    board.set(figure, cell);
    const possibleKnMoves = this.getEmptyCellsAroundKn(
      { board, opponent },
      enemyKnCell,
    );
    possibleKnMoves.map((cell: Cell) => {
      if (this.verifyFigureMove(board, opponent, figure, cell)) {
        this.store.setStrikeAroundKn(this.getOpponentSide(), figure);
      }
    });
  }

  public makeTurn(figure: Figure, cell: Cell): CompletedMove {
    const { board, opponent } = this.board;
    if (!this.verifyFigureMove(board, opponent, figure, cell)) {
      throw new ConflictException("Can't move this figure in cell");
    }
    if (this.isShahRemainsAfterMove(figure, cell)) {
      throw new ConflictException('Stil shah!');
    }
    if (this.isShahAppearsAfterMove(figure, cell)) {
      throw new ConflictException('Shah appears after this move');
    }
    this.removeShah();

    const strike = this.isStrikeAfterMove(cell);
    if (strike) {
      this.removeFigure(this.getOpponentSide(), strike.figure);
    }
    this.updateBoard(figure, cell);

    this.setPossibleShah(figure, cell);
    this.setFigureStrikeAroundKn(figure, cell);

    const shah: null | ShahData = this.setShah(figure);
    const mate: null | MateData = this.setMate(figure);

    return {
      strike,
      mate,
      shah,
    };
  }

  setShah(movedFigure: Figure): null | ShahData {
    const { board, opponent } = this.board;
    const knCell = opponent.get('Kn');
    if (this.verifyFigureMove(board, opponent, movedFigure, knCell)) {
      this.store.setShahData(this.getOpponentSide(), movedFigure);
    }
    return this.store.shah;
  }
  canCoverKnWhenShahed({ byFigure }: ShahData): boolean {
    const { board, opponent } = this.board;
    const cell = board.get(byFigure);
    const possibleMoves = this.getEmptyCellsBetween(opponent.get('Kn'), cell);

    this.store.setNextTurnSide();
    for (const [figure] of opponent) {
      if (figure === 'Kn') continue;
      for (const moveCell of possibleMoves) {
        if (this.verifyFigureMove(opponent, board, figure, moveCell)) {
          this.store.setNextTurnSide();
          return true;
        }
      }
      if (this.verifyFigureMove(opponent, board, figure, cell)) {
        return true;
      }
    }
    this.store.setNextTurnSide();
    return false;
  }
  setMate(movedFigure: Figure): null | MateData {
    if (!this.store.shah) return null;
    if (this.canCoverKnWhenShahed(this.store.shah)) return null;

    const opponentSide = this.getOpponentSide();
    const { board, opponent }: Board = this.board;
    const enemyKnCell: Cell = opponent.get('Kn');

    //get cells which not covered by enemy's figures
    const emptyCells = this.getEmptyCellsAroundKn(
      { board, opponent },
      enemyKnCell,
    );
    const figuresAroundKn = this.store.getStrikeAroundKn()[opponentSide];
    const canKnMoveCells = [];
    for (const emptyCell of emptyCells) {
      let isKingStrikedInCell = false;
      for (const figure of figuresAroundKn) {
        if (this.verifyFigureMove(board, opponent, figure, emptyCell)) {
          isKingStrikedInCell = true;
          break;
        }
      }
      if (!isKingStrikedInCell) {
        canKnMoveCells.push(emptyCell);
      }
    }

    if (canKnMoveCells.length === 0) {
      return {
        matedSide: opponentSide,
        byFigure: movedFigure,
      };
    }
    //check if figure which set shah(movedFigure) can move in kn possible free cells
    for (let i = 0; i < canKnMoveCells.length; i++) {
      const emptyCell = canKnMoveCells[i];
      if (this.verifyFigureMove(board, opponent, movedFigure, emptyCell)) {
        canKnMoveCells.splice(i, 1);
        i--;
      }
    }
    if (canKnMoveCells.length === 0) {
      return {
        matedSide: opponentSide,
        byFigure: movedFigure,
      };
    }
    return null;
  }
}

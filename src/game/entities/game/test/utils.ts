import { Cell, Figure, Figures } from '../game.types';

/**
 *
 * @param c1 Previous cell
 * @param c2 New cell
 * @returns Object
 */
export const clUpdate = (
  c1: Cell,
  c2: Cell,
): {
  prevCell: Cell;
  newCell: Cell;
} => {
  return {
    prevCell: c1,
    newCell: c2,
  };
};

/**
 *
 * @returns Board
 */
export const emptyBoard = (): {
  board: Map<Figure, Cell>;
  opponent: Map<Figure, Cell>;
} => {
  return { board: new Map(), opponent: new Map() };
};

/**
 *
 * @param board
 * @param opponent
 * @description This function return mock for process.getBoard
 */
export const gameBoardFabric = (board: Figures, opponent: Figures) => {
  return () => {
    return {
      board,
      opponent,
    };
  };
};

/**
 *
 * @returns black and white start position
 */
export const boardFabric = (): {
  black: Map<Figure, Cell>;
  white: Map<Figure, Cell>;
} => {
  const black = new Map(
    Object.entries({
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
    }),
  );
  const white = new Map(
    Object.entries({
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
    }),
  );
  return { black, white };
};

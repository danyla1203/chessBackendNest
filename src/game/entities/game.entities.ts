export type Cell = string;
export type Figure = string;
export type Figures = Map<Figure, Cell>;

export class FiguresCellState {
  black: Map<Figure, Cell>;
  white: Map<Figure, Cell>;
}

export class FiguresSet {
  w: Set<Figure>;
  b: Set<Figure>;
}

export class Board {
  board: Figures;
  opponent: Figures;
}
export class CellUpdate {
  prevCell: Cell;
  newCell: Cell;
}

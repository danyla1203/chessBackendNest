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

export class StrikedData {
  strikedSide: 'w' | 'b';
  figure: Figure;
}
export class ShahData {
  shachedSide: 'w' | 'b';
  byFigure: Figure;
}
export class MateData {
  matedSide: 'w' | 'b';
  byFigure: Figure;
}

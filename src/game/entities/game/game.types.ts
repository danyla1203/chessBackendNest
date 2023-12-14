import { Player } from '..';
import { MateData, ShahData, StrikedData } from '../../dto';

export type Cell = string;
export type Figure = string;
export type Figures = Map<Figure, Cell>;

export type FiguresCellState = {
  black: Map<Figure, Cell>;
  white: Map<Figure, Cell>;
};

export type FiguresSet = {
  w: Set<Figure>;
  b: Set<Figure>;
};

export type Board = {
  board: Figures;
  opponent: Figures;
};
export type CellUpdate = {
  prevCell: Cell;
  newCell: Cell;
};

export type Config = {
  side: 'w' | 'b' | 'rand';
  time: number;
  timeIncrement: number;
};

export type GameData = {
  id: number;
  players: Player[];
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

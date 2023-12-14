import { Figure } from '../entities/game';

export type StrikedData = {
  strikedSide: 'w' | 'b';
  figure: Figure;
};
export type ShahData = {
  shachedSide: 'w' | 'b';
  byFigure: Figure;
};
export type MateData = {
  matedSide: 'w' | 'b';
  byFigure: Figure;
};

export type CompletedMove = {
  mate: null | MateData;
  shah: null | ShahData;
  strike: null | StrikedData;
};

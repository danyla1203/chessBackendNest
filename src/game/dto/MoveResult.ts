import { Figure } from '../entities/game.entities';

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

export class CompletedMove {
  mate: null | MateData;
  shah: null | ShahData;
  strike: null | StrikedData;
}

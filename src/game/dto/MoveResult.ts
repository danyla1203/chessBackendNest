export type StrikedData = {
  strikedSide: 'w' | 'b';
  figure: string;
};
export type ShahData = {
  shachedSide: 'w' | 'b';
  byFigure: string;
};
export type MateData = {
  matedSide: 'w' | 'b';
  byFigure: string;
};

export type CompletedMove = {
  mate: null | MateData;
  shah: null | ShahData;
  strike: null | StrikedData;
};

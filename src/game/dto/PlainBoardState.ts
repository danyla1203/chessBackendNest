import { Cell, Figure } from '../entities/game';

export type PlainBoardState = {
  black: { [key: Figure]: Cell };
  white: { [key: Figure]: Cell };
};

import { Cell, Figure } from '../entities';

export class PlainBoardState {
  black: { [key: Figure]: Cell };
  white: { [key: Figure]: Cell };
}

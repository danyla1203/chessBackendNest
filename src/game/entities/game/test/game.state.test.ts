import { Cell, Figure } from '../game.types';
import { GameState } from '../process/game.state';
import { boardFabric } from './utils';

describe('GameState (unit)', () => {
  let state: GameState;
  beforeEach(() => {
    const { white, black } = boardFabric();
    state = new GameState(white, black);
  });
  it('constructor', () => {
    expect(state).toBeDefined();
    expect(state.sideToTurn).toEqual('w');
    expect(state.possibleShahes).toStrictEqual({
      w: new Set(),
      b: new Set(),
    });
    expect(state.strikeAroundKn).toStrictEqual({
      w: new Set(),
      b: new Set(),
    });
  });
  it('removeShah', () => {
    state.shahData = { shachedSide: 'w', byFigure: 'Q' };
    state.removeShah();
    expect(state.shahData).toBeNull();
  });
  it('getBlack', () => {
    const bl = state.blackBoard;
    expect(state.getBlack()).not.toBe(bl);
    expect(state.getBlack()).toStrictEqual(bl);
  });
  it('getWhite', () => {
    const bl = state.whiteBoard;
    expect(state.getWhite()).not.toBe(bl);
    expect(state.getWhite()).toStrictEqual(bl);
  });
  it('get state', () => {
    const st = state.state;
    expect(st).toStrictEqual({
      w: state.whiteBoard,
      b: state.blackBoard,
    });
    expect(st.b).not.toBe(state.blackBoard);
    expect(st.w).not.toBe(state.whiteBoard);
  });
  it('get side', () => {
    expect(state.side).toEqual('w');
  });
  it('set turnSide', () => {
    state.turnSide = 'b';
    expect(state.sideToTurn).toEqual('b');
    state.turnSide = 'w';
    expect(state.sideToTurn).toEqual('w');
  });
  it('setNextTurnSide', () => {
    state.setNextTurnSide();
    expect(state.sideToTurn).toEqual('b');
    state.setNextTurnSide();
    expect(state.sideToTurn).toEqual('w');
  });
  it('get shah', () => {
    expect(state.shah).toEqual(null);
    state.shahData = { shachedSide: 'b', byFigure: 'w' };
    expect(state.shah).toStrictEqual({
      shachedSide: 'b',
      byFigure: 'w',
    });
  });
  it('setShahData', () => {
    state.setShahData('w', 'Q');
    expect(state.shahData).toStrictEqual({
      shachedSide: 'w',
      byFigure: 'Q',
    });
  });
  it('removePossibleShah', () => {
    state.possibleShahes['w'] = new Set(['Q']);
    state.removePossibleShah('w', 'Q');
    expect(state.possibleShahes['w']).toEqual(new Set());
  });
  it('getPossibleShah', () => {
    state.possibleShahes['w'] = new Set(['Q']);
    const set = state.getPossibleShahes('w');
    expect(set).toEqual(new Set(['Q']));
    expect(set).not.toBe(state.possibleShahes['w']);
  });
  it('setPossibleShah', () => {
    state.setPossibleShah('w', 'B1');
    expect(state.possibleShahes['w']).toEqual(new Set(['B1']));
  });
  it('setStrikeAroundKn', () => {
    state.setStrikeAroundKn('w', 'K1');
    expect(state.strikeAroundKn['w']).toEqual(new Set(['K1']));
  });
  it('removeFigure', () => {
    state.removeFigure('w', 'B1');
    expect(state.whiteBoard.get('B1')).not.toBeDefined();
  });
  describe('updateBoard', () => {
    const cases = [
      ['w', 'pawn1', 'd4'],
      ['b', 'pawn2', 'f5'],
      ['w', 'pawn1', 'f3'],
      ['w', 'pawn1', 'd3'],
      ['b', 'pawn1', 'g5'],
      ['b', 'pawn1', 'a6'],
      ['w', 'pawn1', 'b6'],
      ['w', 'pawn1', 'd6'],
    ];
    test.each(cases)(
      'for side: %s, figure: %s, cell: %s should update board',
      (side: 'w' | 'b', figure: Figure, cell: Cell) => {
        state.sideToTurn = side;
        state.updateBoard(figure, cell);
        if (side === 'w') expect(state.whiteBoard.get(figure)).toBe(cell);
        else expect(state.blackBoard.get(figure)).toBe(cell);
      },
    );
  });
});

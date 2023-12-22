import { GameProcess } from '../process/game.process';
import { Board, Cell, Figure } from '../game.types';
import { emptyBoard, gameBoardFabric, boardFabric } from './utils';
import { ShahData } from '../../../dto/MoveResult';

describe('GameProcess (unit)', () => {
  let process: GameProcess;
  beforeEach(() => {
    process = new GameProcess();
  });
  it('constructor', () => {
    const boardLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(process.Letters).toStrictEqual(boardLetters);
    expect(process.state).toBeDefined();
  });
  describe('getOpponentSide', () => {
    const cases = [
      ['w', 'b'],
      ['b', 'w'],
    ];
    test.each(cases)(
      'if side to turn - %p, getOpponentSide should return - %p',
      (sideToTurn: 'w' | 'b', expected) => {
        process.store.sideToTurn = sideToTurn;
        expect(process.getOpponentSide()).toEqual(expected);
      },
    );
  });
  it('initBoard', () => {
    const board = boardFabric();
    expect(process.initBoard()).toStrictEqual(board);
  });
  describe('findNextLetter', () => {
    const cases = [
      ['b', 'a', 'c'],
      ['c', 'b', 'd'],
      ['a', 'b', null],
    ];
    test.each(cases)(
      'input - %p, next letters should be %p %p',
      (input, let1, let2) => {
        const expected = [let1];
        if (typeof let2 === 'string') expected.push(let2);
        expect(process.findNextLetter(input)).toStrictEqual(expected);
      },
      10000,
    );
  });
  describe('getEmptyCellsAroundKn', () => {
    const { white, black } = boardFabric();
    const cases = [
      ['e1', 'w', { board: white, opponent: black }, []],
      [
        'a5',
        'w',
        {
          board: new Map([
            ['pawn1', 'a6'],
            ['pawn2', 'b6'],
            ['pawn3', 'a4'],
          ]),
          opponent: new Map([['pawn1', 'b5']]),
        },
        ['b4', 'b5'],
      ],
    ];
    test.each(cases)(
      'knCell - %s, turning side - %s and board state - %#',
      (
        input: Cell,
        turningSide: 'w' | 'b',
        board: Board,
        expected: string[],
      ) => {
        process.store.turnSide = turningSide;
        expect(process.getEmptyCellsAroundKn(board, input)).toStrictEqual(
          expected,
        );
      },
    );
  });
  it('setFigureStrikeAroundKn', () => {
    process.store.sideToTurn = 'w';
    const black = new Map([['Kn', 'e8']]);
    process.getBoard = gameBoardFabric(new Map(), black);

    process.store.setStrikeAroundKn = jest.fn();
    process.setFigureStrikeAroundKn('B1', 'f5');
    expect(process.store.setStrikeAroundKn).toBeCalled();
    expect(process.store.setStrikeAroundKn).toBeCalledWith('b', 'B1');
  });
  describe('getCellsAround', () => {
    const cases = [
      ['b7', ['b8', 'b6', 'c8', 'c6', 'a8', 'a6', 'a7', 'c7']],
      ['h2', ['h3', 'h1', 'g3', 'g1', 'g2']],
    ];
    test.each(cases)(
      'for input - %p should be array %p',
      (input: string, expected) => {
        expect(process.getCellsAround(input)).toEqual(expected);
      },
    );
  });
  describe('getBoard', () => {
    it('White side', () => {
      process.store.sideToTurn = 'w';
      const expected = {
        board: process.store.whiteBoard,
        opponent: process.store.blackBoard,
      };
      expect(process.getBoard()).toStrictEqual(expected);
    });
    it('Black side', () => {
      process.store.sideToTurn = 'b';
      const expected = {
        board: process.store.blackBoard,
        opponent: process.store.whiteBoard,
      };
      expect(process.getBoard()).toStrictEqual(expected);
    });
  });
  describe('isEnemyInCell', () => {
    const cases = [
      ['w', 'a7', true],
      ['w', 'e8', true],
      ['w', 'a2', false],
      ['w', 'e6', false],
      ['b', 'e2', true],
      ['b', 'e6', false],
      ['b', 'h2', true],
    ];
    test.each(cases)(
      'for turning side - %p and cell - %p should return %p',
      (sideToTurn: 'w' | 'b', cell: Cell, expected) => {
        process.store.sideToTurn = sideToTurn;
        const opponent = process.getBoard().opponent;
        expect(process.isEnemyInCell(opponent, cell)).toStrictEqual(expected);
      },
    );
  });
  describe('isStrikeAfterMove', () => {
    const cases = [
      ['w', 'c7', { strikedSide: 'b', figure: 'pawn3' }],
      ['b', 'e2', { strikedSide: 'w', figure: 'pawn5' }],
      ['w', 'h7', { strikedSide: 'b', figure: 'pawn8' }],
      ['b', 'd2', { strikedSide: 'w', figure: 'pawn4' }],
    ];
    test.each(cases)(
      'for side - %p, target cell - %p, expected - %p',
      (side: 'w' | 'b', targetCell: Cell, expected) => {
        process.store.sideToTurn = side;
        expect(process.isStrikeAfterMove(targetCell)).toStrictEqual(expected);
      },
    );
  });
  describe('canPawnMove', () => {
    let board: Board;
    beforeEach(() => {
      board = emptyBoard();
    });
    describe('tests on empty board', () => {
      const cases = [
        ['c7', 'c5', true],
        ['c7', 'c6', true],
        ['h7', 'h5', true],
        ['h7', 'h7', false],
        ['h7', 'h4', false],
        ['e5', 'f4', false],
        ['e5', 'd4', false],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          process.store.sideToTurn = 'b';
          expect(process.canPawnMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
      const cases2 = [
        ['a2', 'a4', true],
        ['a2', 'a3', true],
        ['g2', 'g4', true],
        ['g2', 'g2', false],
        ['g2', 'g6', false],
        ['a3', 'b4', false],
        ['f5', 'g6', false],
      ];
      test.each(cases2)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          process.store.sideToTurn = 'w';
          expect(process.canPawnMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with enemy figure in newCell', () => {
      const cases = [
        ['h7', 'h5', ['B1', 'h5'], false],
        ['a7', 'a5', ['Q', 'a6'], false],
        ['h7', 'h5', ['pawn3', 'h6'], false],
        ['g7', 'g6', ['K1', 'g6'], false],
        ['f7', 'f5', ['K2', 'g6'], true],
        ['e7', 'e6', ['Kn', 'e4'], true],
        ['a6', 'a5', ['B2', 'a5'], false],
        ['a7', 'b6', ['pawn1', 'b6'], true],
        ['d6', 'c5', ['pawn6', 'c5'], true],
        ['d6', 'e5', ['pawn6', 'e5'], true],
      ];
      test.each(cases)(
        'for cell update %s -> %s with enely %p should be %s',
        (prevCell: Cell, newCell: Cell, enemy, expected) => {
          process.store.sideToTurn = 'b';
          board.opponent.set(enemy[0], enemy[1]);
          expect(process.canPawnMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with ally figure in newCell', () => {
      const cases = [
        ['h7', 'h5', ['B1', 'h5'], false],
        ['a7', 'a5', ['Q', 'a6'], false],
        ['g7', 'g6', ['K1', 'g6'], false],
        ['f7', 'f5', ['K2', 'g6'], true],
        ['e7', 'e6', ['Kn', 'e4'], true],
        ['a6', 'a5', ['B2', 'b6'], true],
        ['h7', 'h6', ['pawn1', 'g6'], true],
      ];
      test.each(cases)(
        'for cell update %s -> %s with ally %p should be %s',
        (prevCell: Cell, newCell: Cell, ally, expected) => {
          process.store.sideToTurn = 'b';
          board.board.set(ally[0], ally[1]);
          expect(process.canPawnMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
  });
  describe('canRockMove', () => {
    let board: Board;
    beforeEach(() => {
      board = emptyBoard();
    });
    describe('test on empty board', () => {
      const cases = [
        ['a1', 'a5', true],
        ['a1', 'h1', true],
        ['f3', 'f8', true],
        ['d8', 'h8', true],
        ['d8', 'd3', true],
        ['h4', 'a4', true],
        ['a1', 'b3', false],
        ['h3', 'f7', false],
        ['e1', 'b8', false],
        ['h5', 'f8', false],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          expect(process.canRockMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with figure on the way to newCell', () => {
      const cases = [
        ['d1', 'd5', false],
        ['d3', 'd4', false],
        ['d3', 'd5', false],
        ['a4', 'e4', false],
        ['c4', 'e4', false],
        ['d8', 'd4', false],
        ['d8', 'h1', false],
        ['f2', 'b2', true],
      ];
      test.each(cases)(
        'ffor cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          board.board.set('pawn3', 'd4');
          expect(process.canRockMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with enemy figure on the way to newCell', () => {
      const cases = [
        ['f1', 'f5', false],
        ['f1', 'f3', true],
        ['f6', 'f5', true],
        ['f6', 'f3', true],
        ['f6', 'f2', false],
        ['b3', 'f3', true],
        ['e3', 'h3', false],
        ['h3', 'f3', true],
        ['h3', 'a3', false],
        ['f4', 'f3', true],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          board.opponent.set('pawn3', 'f3');
          expect(process.canRockMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
  });
  describe('canKnightMove', () => {
    let board: Board;
    beforeEach(() => {
      board = emptyBoard();
    });
    describe('test on empty board', () => {
      const cases = [
        ['c3', 'd1', true],
        ['c3', 'd5', true],
        ['c3', 'b1', true],
        ['c3', 'b5', true],
        ['c3', 'e4', true],
        ['c3', 'e2', true],
        ['c3', 'a4', true],
        ['c3', 'a2', true],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          expect(process.canKnightMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('jump over ally figure', () => {
      const cases = [
        ['c3', 'd1', true],
        ['c3', 'd5', true],
        ['c3', 'e4', true],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          board.board.set('pawn3', 'd4');
          board.board.set('pawn4', 'd2');
          board.board.set('B1', 'e3');
          expect(process.canKnightMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with ally figure on newCell', () => {
      const cases = [
        ['c3', 'd1', false],
        ['c3', 'd5', false],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          board.board.set('pawn3', 'd5');
          board.board.set('pawn4', 'd1');
          expect(process.canKnightMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with enemy figure on newCell', () => {
      const cases = [
        ['c3', 'd1', true],
        ['c3', 'd5', true],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          board.opponent.set('pawn3', 'd5');
          board.opponent.set('pawn4', 'd1');
          expect(process.canKnightMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
  });
  describe('canBishopMove', () => {
    let board: Board;
    beforeEach(() => {
      board = emptyBoard();
    });
    describe('test with emtpy board', () => {
      const cases = [
        ['a1', 'd4', true],
        ['d4', 'f2', true],
        ['f2', 'e1', true],
      ];
      test.each(cases)(
        'or cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          expect(process.canBishopMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with ally figure on the way to newCell', () => {
      const cases = [
        ['e5', 'g8', false],
        ['e7', 'g5', false],
        ['g7', 'e5', false],
        ['g5', 'e7', false],
        ['c3', 'f6', false],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          board.board.set('pawn3', 'f6');
          expect(process.canBishopMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    describe('test with enemy figure on newCell', () => {
      const cases = [
        ['e5', 'g8', false],
        ['e7', 'g5', false],
        ['g7', 'e5', false],
        ['g5', 'e7', false],
        ['g5', 'f6', true],
      ];
      test.each(cases)(
        'for cell update %s -> %s should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          board.opponent.set('pawn3', 'f6');
          expect(process.canBishopMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
  });
  describe('canKnMove', () => {
    let board: Board;
    beforeEach(() => {
      board = emptyBoard();
    });
    describe('test on empty board', () => {
      const cases = [
        ['c5', 'c6', true],
        ['c5', 'd6', true],
        ['c5', 'd5', true],
        ['c5', 'd4', true],
        ['c5', 'c4', true],
        ['c5', 'b4', true],
        ['c5', 'b5', true],
        ['c5', 'b6', true],
      ];
      test.each(cases)(
        'for cell update - %p should return %p',
        (prevCell: Cell, newCell: Cell, expected) => {
          expect(process.canKnMove(board, { prevCell, newCell })).toEqual(
            expected,
          );
        },
      );
    });
    it('test with enemy figure', () => {
      board.opponent.set('R1', 'b6');
      expect(
        process.canKnMove(board, { prevCell: 'c5', newCell: 'd6' }),
      ).toEqual(true);
    });
    it('test with ally figure', () => {
      board.board.set('R1', 'b6');
      expect(
        process.canKnMove(board, { prevCell: 'c5', newCell: 'b6' }),
      ).toEqual(false);
    });
  });
  describe('shah logic', () => {
    it('isShahRemainsAfterMove', () => {
      process.store.sideToTurn = 'w';
      process.store.shahData = null;
      expect(process.isShahRemainsAfterMove('pawn3', 'c3')).toEqual(false);
      process.store.shahData = { shachedSide: 'b', byFigure: 'B1' };
      expect(process.isShahRemainsAfterMove('pawn3', 'c3')).toEqual(false);

      process.store.shahData.shachedSide = 'w';
      process.getBoard = () => {
        return {
          board: new Map([
            ['Kn', 'e8'],
            ['pawn5', 'e7'],
            ['pawn4', 'd7'],
          ]),
          opponent: new Map([['B1', 'f7']]),
        };
      };
      expect(process.isShahRemainsAfterMove('Kn', 'f7')).toEqual(false);
      expect(process.isShahRemainsAfterMove('Kn', 'f8')).toEqual(false);

      process.store.shahData.byFigure = 'Q';
      process.getBoard = () => {
        return {
          board: new Map([
            ['Kn', 'e8'],
            ['pawn5', 'e7'],
            ['pawn4', 'd7'],
          ]),
          opponent: new Map([['Q', 'f7']]),
        };
      };
      expect(process.isShahRemainsAfterMove('Kn', 'f7')).toEqual(false);
      expect(process.isShahRemainsAfterMove('Kn', 'f8')).toEqual(true);
    });
    describe('isShahAppearsAfterMove', () => {
      beforeEach(() => {
        process.store.sideToTurn = 'b';
        process.store.getPossibleShahes = () => new Set(['B1']);
        process.getBoard = () => {
          return {
            board: new Map([
              ['Kn', 'e8'],
              ['pawn6', 'f7'],
            ]),
            opponent: new Map([['B1', 'h5']]),
          };
        };
      });
      const cases = [
        ['pawn6', 'f6', true],
        ['Kn', 'd8', false],
        ['Kn', 'f8', false],
      ];
      test.each(cases)(
        'after move %s to %p should return %p',
        (figure: Figure, cell: Cell, expected) => {
          expect(process.isShahAppearsAfterMove(figure, cell)).toEqual(
            expected,
          );
        },
      );
    });
    it('setPossibleShah', () => {
      process.store.sideToTurn = 'w';
      process.store.setPossibleShah = jest.fn();
      process.getBoard = () => {
        return {
          board: new Map(),
          opponent: new Map([['Kn', 'd8']]),
        };
      };
      process.setPossibleShah('R1', 'd5');
      expect(process.store.setPossibleShah).toBeCalledTimes(1);
      expect(process.store.setPossibleShah).toBeCalledWith('b', 'R1');
    });
    it('setShah', () => {
      process.store.sideToTurn = 'w';
      process.store.setShahData = jest.fn();
      process.getBoard = () => {
        return {
          board: new Map([['pawn3', 'c7']]),
          opponent: new Map([['Kn', 'd8']]),
        };
      };
      const expected: any = {
        shachedSide: 'b',
        byFigure: 'pawn3',
      };
      process.store.shahData = expected;
      expect(process.setShah('pawn3')).toEqual(expected);
      expect(process.store.setShahData).toBeCalled();
      expect(process.store.setShahData).toBeCalledWith('b', 'pawn3');
    });
  });
  describe('mate logic', () => {
    describe('getEmptyCellsBetween', () => {
      const cases = [
        ['f5', 'f6', []],
        ['f5', 'f8', ['f7', 'f6']],
        ['f5', 'h5', ['g5']],
        ['f5', 'f4', []],
        ['f5', 'f3', ['f4']],
        ['f5', 'h3', ['g4']],
        ['f5', 'f5', []],
      ];
      test.each(cases)(
        'for cell update - %s -> %s should return %p',
        (cell1: Cell, cell2: Cell, expected) => {
          expect(process.getEmptyCellsBetween(cell1, cell2)).toStrictEqual(
            expected,
          );
        },
      );
    });
    describe('canCoverKnWhenShahed', () => {
      let testShah: ShahData;
      beforeEach(() => {
        testShah = {
          shachedSide: 'b',
          byFigure: 'B1',
        };
        process.store.shahData = testShah;
      });
      const cases = [
        [
          {
            board: new Map([['B1', 'f6']]),
            opponent: new Map([
              ['Kn', 'd8'],
              ['pawn3', 'e5'],
            ]),
          },
          false,
        ],
        [
          {
            board: new Map([['B1', 'f6']]),
            opponent: new Map([
              ['Kn', 'd8'],
              ['R1', 'e5'],
            ]),
          },
          true,
        ],
        [
          {
            board: new Map([['B1', 'f6']]),
            opponent: new Map([
              ['Kn', 'd8'],
              ['R1', 'f8'],
            ]),
          },
          true,
        ],
      ];
      test.each(cases)('%# board, should be %p', (board: Board, expected) => {
        process.getBoard = () => board;
        expect(process.canCoverKnWhenShahed(testShah)).toEqual(expected);
      });
    });
  });
});

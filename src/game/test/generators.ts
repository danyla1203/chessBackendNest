import { faker } from '@faker-js/faker';
import { Client, Player } from '../entities';
import { Config, GameResult } from '../entities/game';

export const generateGameResult = (): GameResult => {
  return {
    id: faker.number.int(),
    config: generateConfig(),
    moves: [],
  };
};

export const generatePlayer = (
  side: 'w' | 'b',
  authorized = true,
  userId = parseInt(faker.string.nanoid(8)),
): Player => {
  const cl = generateClient(authorized, userId);
  return {
    side,
    time: faker.number.int({ min: 0, max: 1000000 }),
    ...cl,
  };
};

export const generateClient = (
  authorized = true,
  userId = parseInt(faker.string.nanoid(8)),
): Client => {
  return {
    id: faker.string.nanoid(8),
    name: faker.internet.userName(),
    authorized,
    userId,
    join: jest.fn(),
    emit: jest.fn(),
    toRoom: jest.fn(),
  };
};
export const generateConfig = (side: 'w' | 'b' | 'rand' = 'w'): Config => {
  return {
    side,
    time: faker.number.int({ min: 3600, max: 100000 }),
    timeIncrement: faker.number.int({ min: 60, max: 10000 }),
  };
};

export const getFigureCellState = () => {
  const b = {
    pawn1: 'a7',
    pawn2: 'b7',
    pawn3: 'c7',
    pawn4: 'd7',
    pawn5: 'e7',
    pawn6: 'f7',
    pawn7: 'g7',
    pawn8: 'h7',
    R1: 'a8',
    B1: 'c8',
    K1: 'b8',
    Q: 'd8',
    Kn: 'e8',
    K2: 'g8',
    B2: 'f8',
    R2: 'h8',
  };
  const w = {
    pawn1: 'a2',
    pawn2: 'b2',
    pawn3: 'c2',
    pawn4: 'd2',
    pawn5: 'e2',
    pawn6: 'f2',
    pawn7: 'g2',
    pawn8: 'h2',
    R1: 'a1',
    B1: 'c1',
    K1: 'b1',
    Q: 'd1',
    Kn: 'e1',
    K2: 'g1',
    B2: 'f1',
    R2: 'h1',
  };
  return {
    w,
    b,
  };
};

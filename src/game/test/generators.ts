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
  userId = faker.number.int({ max: 99999, min: 1 }),
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
    a7: 'pawn1',
    b7: 'pawn2',
    c7: 'pawn3',
    d7: 'pawn4',
    e7: 'pawn5',
    f7: 'pawn6',
    g7: 'pawn7',
    h7: 'pawn8',
    a8: 'R1',
    c8: 'B1',
    b8: 'K1',
    d8: 'Q',
    e8: 'Kn',
    g8: 'K2',
    f8: 'B2',
    h8: 'R2',
  };
  const w = {
    a2: 'pawn1',
    b2: 'pawn2',
    c2: 'pawn3',
    d2: 'pawn4',
    e2: 'pawn5',
    f2: 'pawn6',
    g2: 'pawn7',
    h2: 'pawn8',
    a1: 'R1',
    c1: 'B1',
    b1: 'K1',
    d1: 'Q',
    e1: 'Kn',
    g1: 'K2',
    f1: 'B2',
    h1: 'R2',
  };
  return {
    w,
    b,
  };
};

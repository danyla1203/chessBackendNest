import { Prisma } from '@prisma/client';

export class User {}

export const userFields = {
  id: true,
  name: true,
  email: true,
};

export class UserFields {
  id: number;
  name: string;
  email: string;
}

export class UserGames {
  id: number;
  maxTime: number;
  timeIncrement: number;
  sideSelecting: string;
  isDraw: boolean;
  moves: Prisma.JsonValue;
  players: {
    userId: number;
    side: string;
    isWinner: boolean;
    user: {
      id: number;
      name: string;
    };
  }[];
}

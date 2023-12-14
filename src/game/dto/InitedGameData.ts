export type InitedGameData = {
  board: {
    white: {
      [k: string]: string;
    };
    black: {
      [k: string]: string;
    };
  };
  gameId: number;
  side: 'w' | 'b';
  maxTime: number;
  timeIncrement: number;
};

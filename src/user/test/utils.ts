export const generateUserGames = () => {
  const stub = [];
  for (let i = 0; i < 5; i++) {
    stub.push({
      id: i,
      maxTime: 360000,
      timeIncrement: 3600,
      sideSelecting: 'w',
      isDraw: false,
      moves: [],
      players: [
        {
          userId: 1,
          side: 'w',
          isWinner: true,
          user: {
            id: 1,
            name: 'Test1',
          },
        },
        {
          userId: 2,
          side: 'b',
          isWinner: false,
          user: {
            id: 2,
            name: 'Test2',
          },
        },
      ],
    });
  }
  const exp = [];
  for (let i = 0; i < 5; i++) {
    exp.push({
      id: i,
      key: i,
      sidepick: 'w',
      cnf: {
        inc: 3,
        time: 6,
      },
      result: {
        winner: {
          userId: 1,
          side: 'w',
          winner: true,
          name: 'Test1',
        },
        looser: {
          userId: 2,
          side: 'b',
          winner: false,
          name: 'Test2',
        },
      },
    });
  }
  return { stub, exp };
};

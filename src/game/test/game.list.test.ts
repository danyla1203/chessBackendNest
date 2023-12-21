import { Game } from '../entities/game';
import { GameList } from '../game.list';
import { generateClient, generateConfig } from './generators';

describe('GameList (unit)', () => {
  let list: GameList;
  beforeEach(() => {
    list = new GameList();
    for (let i = 0; i < 10; i++) {
      const config = generateConfig();
      const fClient = generateClient();
      const game = new Game(fClient, config, jest.fn());
      list.lobby.push(game);
    }
  });

  it('addGameToLobby', () => {
    const config = generateConfig();
    const fClient = generateClient();
    const game = new Game(fClient, config, jest.fn());

    list.addGameToLobby(game);
    expect(list.lobby).toHaveLength(11);
  });
  it('find in lobby', () => {
    const game = list.lobby[5];
    expect(list.findInLobby(game.id)).toStrictEqual(game);
  });
  it('should remove game from lobby on user leave', () => {
    const cl = list.lobby[6].players[0];
    list.removeGameFromLobbyByPlayer(cl);
    expect(list.lobby).toHaveLength(9);
  });
});

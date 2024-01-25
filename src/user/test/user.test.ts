import { Test } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserModel } from '../model';
import { AuthService } from '../../auth';
import { generateUserGames } from './utils';

describe('UserService (unit)', () => {
  let service: UserService;
  let games;
  let model;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UserService, UserModel, AuthService],
    })
      .overrideProvider(UserModel)
      .useValue({})
      .overrideProvider(AuthService)
      .useValue({})
      .compile();
    service = moduleRef.get(UserService);
    model = moduleRef.get(UserModel);
    games = generateUserGames();
  });

  describe('restruct user games', () => {
    it('with winner&looser', () => {
      const exp = games.exp;
      expect(service['restructUserGames'](games.stub)).toStrictEqual(exp);
    });
  });
  describe('games method', () => {
    it('should return parsed games, and stats', () => {
      model.findUserGames = jest.fn(() => games.stub);
      service['restructUserGames'] = jest.fn(() => games.exp);

      expect(service.games(1)).resolves.toStrictEqual({
        games: games.exp,
        wins: 5,
        looses: 0,
        draws: 0,
      });
    });
  });
});

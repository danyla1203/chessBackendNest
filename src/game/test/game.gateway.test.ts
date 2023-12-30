import { Test } from '@nestjs/testing';
import { GameGateway } from '../game.gateway';
import { GameService } from '../game.service';
import { AuthService, TokenService } from '../../auth';
import { Game, Lobby, room } from '../EmitTypes';
import { faker } from '@faker-js/faker';
import { UserFields } from 'src/user/entities';
import { generateConfig } from './generators';

jest.mock('../game.service');
jest.mock('../../auth');
jest.mock('../game.service');

describe('GameGateway (unit)', () => {
  let gateway: GameGateway;
  let service: GameService;
  let tokenService: TokenService;
  let authService: AuthService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [GameGateway, GameService, AuthService, TokenService],
    }).compile();
    service = moduleRef.get(GameService);
    authService = moduleRef.get(AuthService);
    tokenService = moduleRef.get(TokenService);
    gateway = moduleRef.get(GameGateway);
    const emit = jest.fn();
    gateway.server = {
      emit,
      to: jest.fn(() => {
        return {
          emit,
        };
      }),
    } as any;
  });
  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
  it('handleDisconnect', () => {
    const stubClient = {};
    jest.spyOn(service, 'getLobby').mockImplementationOnce(() => []);
    gateway.handleDisconnect(stubClient);
    expect(service.removeGameInLobby).toBeCalledWith(stubClient);
    expect(gateway.server.emit).toBeCalledWith(Lobby.update, []);
  });
  describe('handleConnection', () => {
    let client: any;
    beforeEach(() => {
      client = {
        handshake: {
          query: {},
        },
        emit: jest.fn(),
      };
    });
    it('Anonymous connection', () => {
      jest.spyOn(tokenService, 'parseToken').mockImplementationOnce(() => {
        throw Error();
      });
      jest.spyOn(service, 'getLobby').mockImplementationOnce(() => []);
      gateway.handleConnection(client);
      expect(client.authorized).toBeFalsy();
      expect(client.name).toEqual('Anonymous');
      expect(client.emit).toBeCalledWith(Lobby.update, []);
    });
    it('Authorized connection', async () => {
      const stubedTokenData = {
        id: faker.string.nanoid(6),
        deviceId: faker.string.uuid(),
      };
      const userFields: UserFields = {
        id: faker.number.int(7),
        email: faker.internet.email(),
        name: faker.internet.userName(),
      };
      jest.spyOn(tokenService, 'parseToken').mockImplementationOnce(() => {
        return stubedTokenData;
      });
      jest
        .spyOn(authService, 'validateCreds')
        .mockImplementationOnce(async () => {
          return userFields;
        });
      jest.spyOn(service, 'getLobby').mockImplementationOnce(() => []);
      await gateway.handleConnection(client);
      expect(client.name).toEqual(userFields.name);
      expect(client.authorized).toBeTruthy();
      expect(client.userId).toEqual(userFields.id);
      expect(client.emit).toBeCalledWith(Lobby.update, []);
    });
  });
  describe('message handlers', () => {
    let player: any;
    let player2: any;
    let game: any;
    beforeEach(() => {
      player = {
        handshake: {
          query: {},
        },
        emit: jest.fn(),
        join: jest.fn(),
        toRoom: jest.fn(),
      };
      player2 = { ...player };
      game = {
        id: faker.number.int(5),
        players: [player, player2],
        start: jest.fn(),
        getInitedGameData: jest.fn().mockReturnValue({}),
        makeTurn: jest.fn().mockImplementation(() => {
          return {
            shah: {},
            mate: {},
            strike: {},
          };
        }),
      };
      jest.spyOn(service, 'getLobby').mockImplementationOnce(() => []);
    });
    it('create game', async () => {
      const gameId = faker.number.int(5);
      jest.spyOn(service, 'createGame').mockImplementationOnce((): any => {
        return { id: gameId };
      });
      const cnf = generateConfig();
      await gateway.createGame(player, cnf);
      expect(service.createGame).toBeCalledWith(player, cnf);
      expect(player.join).toBeCalledWith(room(gameId));
      expect(player.emit).toBeCalledWith(Game.created, { gameId });
      expect(gateway.server.emit).toBeCalledWith(Lobby.update, []);
    });
    it('join', () => {
      jest.spyOn(service, 'connectToGame').mockImplementationOnce((): any => {
        return game;
      });

      gateway.joinGame(player2, { gameId: game.id });
      expect(service.connectToGame).toBeCalledWith(player2, game.id);
      expect(player2.join).toBeCalledWith(room(game.id));

      expect(player2.emit).toBeCalledWith(Game.init, {});
      expect(player.emit).toBeCalledWith(Game.init, {});

      expect(gateway.server.to).toBeCalledWith(room(game.id));
      expect(game.start).toBeCalled();
      expect(gateway.server.emit).toBeCalledWith(Lobby.update, []);
    });
    it('move', () => {
      jest.spyOn(service, 'findGameById').mockImplementationOnce((): any => {
        return game;
      });
      jest
        .spyOn(service, 'getActualGameState')
        .mockImplementationOnce((): any => {
          return {};
        });
      gateway.move(player, { gameId: game.id, figure: 'B1', cell: 'a4' });
      expect(game.makeTurn).toBeCalledWith(player.id, 'B1', 'a4');
      expect(service.getActualGameState).toBeCalledWith(game);

      expect(gateway.server.to).toBeCalledWith(room(game.id));
      expect(gateway.server.to(room(game.id)).emit).toHaveBeenNthCalledWith(
        1,
        Game.shah,
        {},
      );
      expect(gateway.server.to(room(game.id)).emit).toHaveBeenNthCalledWith(
        2,
        Game.mate,
        {},
      );
      expect(gateway.server.to(room(game.id)).emit).toHaveBeenNthCalledWith(
        3,
        Game.strike,
        {},
      );
      expect(gateway.server.to(room(game.id)).emit).toHaveBeenNthCalledWith(
        4,
        Game.boardUpdate,
        {},
      );
    });
    it('send message in game chat', () => {
      jest.spyOn(service, 'findGameById').mockImplementationOnce((): any => {
        return game;
      });
      const message = {};
      jest.spyOn(service, 'pushMessage').mockImplementationOnce((): any => {
        return message;
      });
      gateway.chatMessage(player, { gameId: game.id, text: 'some text' });
      expect(service.pushMessage).toBeCalledWith(game, 'some text', player);
      expect(gateway.server.to).toBeCalledWith(room(game.id));
      expect(gateway.server.to(room(game.id)).emit).toBeCalledWith(
        Game.message,
        message,
      );
    });
    it('surrender', async () => {
      const surrenderData = {
        game,
        winner: player,
        looser: player2,
      };
      jest.spyOn(service, 'surrender').mockImplementationOnce(async () => {
        return surrenderData;
      });
      await gateway.surrender(player2, { gameId: game.id });
      expect(gateway.server.to(room(game.id)).emit).toBeCalledWith(
        Game.surrender,
        {
          winner: surrenderData.winner,
          looser: surrenderData.looser,
        },
      );
    });
    it('set draw purpose', () => {
      const stubDraw: any = {};
      jest.spyOn(service, 'purposeDraw').mockImplementationOnce(() => {
        return stubDraw;
      });
      gateway.drawPurpose(player, { gameId: game.id });
      expect(player.toRoom).toBeCalledWith(
        room(game.id),
        Game.drawPurpose,
        stubDraw,
      );
    });
    it('accept draw', async () => {
      const stubDraw: any = {};
      jest.spyOn(service, 'acceptDraw').mockImplementationOnce(() => {
        return stubDraw;
      });
      await gateway.acceptPurpose(player, { gameId: game.id });
      expect(gateway.server.to(room(game.id)).emit).toBeCalledWith(Game.draw);
    });
    it('reject draw', () => {
      const stubDraw: any = {};
      jest.spyOn(service, 'rejectDraw').mockImplementationOnce(() => {
        return stubDraw;
      });
      gateway.rejectPurpose({ gameId: game.id });
      expect(gateway.server.to(room(game.id)).emit).toBeCalledWith(
        Game.rejectDraw,
        stubDraw,
      );
    });
    it('add time to another player', () => {
      const result = {};
      jest
        .spyOn(service, 'addTimeToAnotherPlayer')
        .mockImplementationOnce(() => {
          return result;
        });
      gateway.addTime(player, { gameId: game.id });
      expect(gateway.server.to(room(game.id)).emit).toBeCalledWith(
        Game.addTime,
        result,
      );
    });
  });
});

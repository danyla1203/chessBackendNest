import { Test } from '@nestjs/testing';
import { GameGateway } from '../game.gateway';
import { GameService } from '../game.service';
import { AuthService, TokenService } from '../../auth';
import { Game, Lobby, room } from '../EmitTypes';
import { faker } from '@faker-js/faker';
import { generateConfig } from './generators';
import { LoggerService } from '../../tools/logger';
import { Client } from '../entities';
import { ConnectionProvider } from '../connection.provider';

jest.mock('../game.service');
jest.mock('../../auth');
jest.mock('../game.service');

describe('GameGateway (unit)', () => {
  let gateway: GameGateway;
  let service: GameService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        GameService,
        AuthService,
        TokenService,
        LoggerService,
        ConnectionProvider,
      ],
    })
      .overrideProvider(LoggerService)
      .useValue({ log: jest.fn() })
      .compile();
    service = moduleRef.get(GameService);
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
    gateway.handleDisconnect(stubClient as Client);
    expect(service.removeInitedGamesBy).toBeCalledWith(stubClient);
    expect(gateway.server.emit).toBeCalledWith(Lobby.update, []);
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
            result: {
              shah: null,
              mate: null,
              strike: null,
            },
            prevCell: '',
            side: '',
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
    it('rejoin', () => {
      jest
        .spyOn(service, 'findPendingGameThrowable')
        .mockImplementationOnce(() => {
          return {
            id: 12345,
            getInitedGameData: jest.fn(() => {
              return {
                id: 12345,
              };
            }),
          } as any;
        });
      gateway.rejoinGame(player);
      expect(player.join).toBeCalledWith(room(12345));
      expect(player.emit).toBeCalledWith(Game.init, { id: 12345 });
      expect(gateway.server.to).toBeCalledWith(room(12345));
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

      gateway.move(player, { gameId: game.id, figure: 'B1', cell: 'a4' });
      expect(game.makeTurn).toBeCalledWith(player.id, 'B1', 'a4');

      expect(gateway.server.to).toBeCalledWith(room(game.id));
      expect(gateway.server.to(room(game.id)).emit).toHaveBeenCalledWith(
        Game.boardUpdate,
        {
          effect: { shah: null, mate: null, strike: null },
          update: { figure: 'B1', cell: 'a4', prevCell: '', side: '' },
        },
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

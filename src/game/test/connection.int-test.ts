import { Test } from '@nestjs/testing';
import { GameGateway } from '../game.gateway';
import { GameService } from '../game.service';
import { AuthService, TokenService } from '../../auth';
import { Game, Lobby, User } from '../EmitTypes';
import { LoggerService } from '../../tools/logger';
import { AppModule } from '../../app.module';

jest.mock('../game.service');
jest.mock('axios', () => null);

describe('Socket connection (integration)', () => {
  let gateway: GameGateway;
  let authService: AuthService;
  let tokenService: TokenService;
  let gmService: GameService;
  let client: any;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useValue({
        log: jest.fn(),
      })
      .compile();
    gateway = moduleRef.get(GameGateway);
    authService = moduleRef.get(AuthService);
    tokenService = moduleRef.get(TokenService);
    gmService = moduleRef.get(GameService);
    client = {
      emit: jest.fn(),
    };
    gateway.server = {
      emit: jest.fn(),
    } as any;
  });

  describe('anonymous flow', () => {
    beforeEach(() => {
      jest.spyOn(gmService, 'getLobby').mockImplementationOnce(() => []);
      client.handshake = {
        query: '',
      };
    });
    it('anonymous connection without temp token', async () => {
      jest
        .spyOn(gmService, 'findPendingGame')
        .mockImplementationOnce(() => null);
      await gateway.handleConnection(client);
      expect(client.name).toEqual('Anonymous');
      expect(client).toHaveProperty('token');
      expect(client).toHaveProperty('userId');
      expect(client.authorized).toBeFalsy();
      expect(client.emit).toBeCalledWith(Lobby.update, []);
    });
    it('anonymous connection without temp token - return pending game', async () => {
      jest.spyOn(gmService, 'findPendingGame').mockImplementationOnce(() => {
        return {
          id: 12345,
        } as any;
      });
      jest.spyOn(gmService, 'updateSocket').mockImplementation();
      await gateway.handleConnection(client);
      expect(client.name).toEqual('Anonymous');
      expect(client).toHaveProperty('token');
      expect(client).toHaveProperty('userId');
      expect(client.authorized).toBeFalsy();
      expect(client.emit).toHaveBeenNthCalledWith(
        1,
        User.anonymousToken,
        client.token,
      );
      expect(client.emit).toHaveBeenNthCalledWith(2, Game.pendingGame, {
        gameId: 12345,
      });
      expect(client.emit).toHaveBeenNthCalledWith(3, Lobby.update, []);
    });
    it('anonymous connection with temp token', async () => {
      jest
        .spyOn(gmService, 'findPendingGame')
        .mockImplementationOnce(() => null);
      client.handshake = {
        query: {
          Authorization: 'Bearer tempToken',
        },
      };
      await gateway.handleConnection(client);
      expect(client.name).toEqual('Anonymous');
      expect(client).toHaveProperty('userId');
      expect(client.authorized).toBeFalsy();
      expect(client.emit).toBeCalledWith(Lobby.update, []);
    });
  });
  describe('authorized flow', () => {
    beforeEach(() => {
      client.handshake = {
        query: {
          Authorization: 'Bearer accessToken',
        },
      };
      jest.spyOn(tokenService, 'parseToken').mockImplementationOnce(() => {
        return {
          id: 12345,
          deviceId: 'devId',
        };
      });
      jest
        .spyOn(authService, 'validateCreds')
        .mockImplementationOnce(async () => {
          return {
            name: 'Danek',
            id: 12345,
            email: 'email@gmail.com',
          };
        });
      jest.spyOn(gmService, 'getLobby').mockImplementationOnce(() => []);
    });
    it('authorized conn', async () => {
      jest
        .spyOn(gmService, 'findPendingGame')
        .mockImplementationOnce(() => null);
      await gateway.handleConnection(client);
      expect(client.name).toEqual('Danek');
      expect(client.userId).toEqual(12345);
      expect(client.authorized).toBeTruthy();
      expect(client.emit).toBeCalledWith(Lobby.update, []);
    });
    it('authorized conn with pending game', async () => {
      jest.spyOn(gmService, 'findPendingGame').mockImplementationOnce(() => {
        return {
          id: 12345,
        } as any;
      });
      jest.spyOn(gmService, 'updateSocket').mockImplementation();
      await gateway.handleConnection(client);
      expect(client.name).toEqual('Danek');
      expect(client.userId).toEqual(12345);
      expect(client.authorized).toBeTruthy();
      expect(client.emit).toHaveBeenNthCalledWith(1, Game.pendingGame, {
        gameId: 12345,
      });
      expect(client.emit).toHaveBeenNthCalledWith(2, Lobby.update, []);
    });
  });
});

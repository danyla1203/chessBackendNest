import { Test } from '@nestjs/testing';
import { AuthService, TokenService } from '../../auth';
import { LoggerService } from '../../tools/logger';
import { Anonymous } from '../entities/Anonymous';
import { ConnectionProvider } from '../connection.provider';
import { User } from '../EmitTypes';

jest.mock('../../auth');

describe('Connection provider (unit)', () => {
  let tokenService: TokenService;
  let authService: AuthService;
  let provider: ConnectionProvider;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, TokenService, LoggerService, ConnectionProvider],
    }).compile();
    authService = moduleRef.get(AuthService);
    tokenService = moduleRef.get(TokenService);
    provider = moduleRef.get(ConnectionProvider);
  });
  it('anonymousUser', () => {
    jest.spyOn(tokenService, 'anonymousToken').mockImplementationOnce(() => {
      return {
        token: 'string',
        exp: 'exp',
      };
    });
    jest.spyOn(Math, 'random').mockImplementationOnce(() => {
      return 0.12345;
    });
    const expected = new Anonymous(12345, 'string', 'exp');
    expect(provider['anonymousUser']()).toEqual(expected);
  });
  describe('process client connection', () => {
    let client: any;
    beforeEach(() => {
      client = {
        handshake: {
          query: {},
        },
        emit: jest.fn(),
      };
    });
    it('conn without token', async () => {
      jest.spyOn(authService, 'validateCreds').mockImplementationOnce(() => {
        throw new Error();
      });
      jest.spyOn(provider as any, 'anonymous').mockImplementation();
      await provider.processClient(client);
      expect(provider['anonymous']).toBeCalledWith(client);
    });
    it('connection with correct token', async () => {
      jest
        .spyOn(authService, 'validateCreds')
        .mockImplementationOnce(async () => {
          return {
            name: 'Name',
            id: 5,
            email: 'email@gmail.com',
          };
        });
      jest.spyOn(provider as any, 'withToken').mockImplementation();
      await provider.processClient(client);
      expect(provider['withToken']).toBeCalledWith(client);
    });
    it('anonymous method', () => {
      jest
        .spyOn(provider as any, 'anonymousUser')
        .mockImplementationOnce(() => {
          return {
            userId: 1,
            name: 'Anonymous',
            tempToken: 'string',
            exp: 'exp',
          };
        });
      provider['anonymous'](client);
      expect(client.userId).toEqual(1);
      expect(client.name).toEqual('Anonymous');
      expect(client.token).toEqual('string');
      expect(client.emit).toBeCalledWith(User.anonymousToken, 'string');
    });
    it('anonymousSession', () => {
      const payload = {
        name: 'Anonymous',
        id: -1,
      };
      provider['anonymousSession'](payload, client);
      expect(client.name).toEqual(payload.name);
      expect(client.userId).toEqual(payload.id);
    });
    it('authorized', async () => {
      const payload = {
        id: -1,
        deviceId: 'string',
      };
      jest
        .spyOn(authService, 'validateCreds')
        .mockImplementationOnce(async () => {
          return {
            name: 'Danek',
            id: -1,
            email: 'email@gmail.com',
          };
        });
      await provider['authorized'](payload, client);
      expect(client.name).toEqual('Danek');
      expect(client.authorized).toBeTruthy();
      expect(client.userId).toEqual(-1);
    });
  });
});

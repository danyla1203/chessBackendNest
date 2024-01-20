import { Test } from '@nestjs/testing';
import { AuthService, TokenService } from '../../auth';
import { LoggerService } from '../../tools/logger';
import { Anonymous } from '../entities/Anonymous';
import { ConnectionProvider } from '../connection.provider';
import { faker } from '@faker-js/faker';

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
    it('connection with invalid token', async () => {
      jest.spyOn(authService, 'validateCreds').mockImplementationOnce(() => {
        throw new Error();
      });
      const payload = {
        name: 'Anonymous',
        id: 12345,
      };
      await provider['withToken'](payload, client);
      expect(client.name).toBe('Anonymous');
      expect(client.userId).toEqual(12345);
    });
    it('connection with auth and correct token', async () => {
      const auth = {
        name: faker.internet.userName(),
        id: faker.number.int(5),
        email: faker.internet.email(),
      };
      jest
        .spyOn(authService, 'validateCreds')
        .mockImplementationOnce(async () => {
          return auth;
        });
      await provider['withToken']({ id: 12345, deviceId: 'dId' }, client);
      expect(client.name).toEqual(auth.name);
      expect(client.userId).toEqual(auth.id);
      expect(client.authorized).toBeTruthy();
    });
    it('Anonymous connection (without token)', async () => {
      jest
        .spyOn(provider as any, 'anonymous')
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementationOnce(() => {});
      jest
        .spyOn(tokenService, 'parseToken')
        .mockImplementationOnce(async () => {
          throw new Error();
        });
      await provider.processClient(client);
      expect(provider['anonymous']).toBeCalledWith(client);
    });
    it('Authorized connection', async () => {
      const stubedTokenData = {
        id: faker.string.nanoid(6),
        deviceId: faker.string.uuid(),
      };
      jest.spyOn(tokenService, 'parseToken').mockImplementationOnce(() => {
        return stubedTokenData;
      });
      jest
        .spyOn(provider as any, 'withToken')
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementationOnce(async () => {});
      await provider.processClient(client);
      expect(provider['withToken']).toBeCalledWith(stubedTokenData, client);
    });
  });
});

import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TokenModule } from './tokens/tokens.module';
import { AuthModel } from './model';
import { TokenService } from './tokens/token.service';
import { PrismaService } from '../prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let model: AuthModel;
  let tokenService: TokenService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TokenModule],
      providers: [AuthService, AuthModel, PrismaService],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
    model = moduleRef.get<AuthModel>(AuthModel);
    tokenService = moduleRef.get<TokenService>(TokenService);
  });

  describe('use refresh', () => {
    beforeEach(() => {
      jest.spyOn(model, 'deleteSession').mockImplementation(async () => null);
      jest.spyOn(model, 'createSession').mockImplementation(async () => null);
    });
    it('should return pair of tokens', async () => {
      const token = 'test';
      const auth = {
        id: -1,
        userId: -1,
        deviceId: 'test',
        expiresIn: new Date(Date.now() + 1000 * 60 * 60),
        refreshToken: token,
      };
      jest.spyOn(model, 'findSession').mockImplementation(async () => auth);

      const result = { access: 'token', refresh: 'token' };
      jest
        .spyOn(tokenService, 'getPair')
        .mockImplementation(async () => result);
      expect(await service.useRefresh(token)).toStrictEqual(result);
    });
    it('should throw error if no auth found', () => {
      jest.spyOn(model, 'findSession').mockImplementation(async () => null);
      expect(service.useRefresh('test')).rejects.toThrow('Unauthorized');
    });
    it('should throw error if auth expired', () => {
      const auth: any = {
        expiresIn: new Date(Date.now() - 1000 * 60 * 60),
      };
      jest.spyOn(model, 'findSession').mockImplementation(async () => auth);
      expect(service.useRefresh('test')).rejects.toThrow('Session expired');
    });
  });
  describe('validate creds', () => {
    beforeEach(() => {
      jest.spyOn(model, 'deleteSession').mockImplementation(async () => null);
    });

    it('should return user', async () => {
      const auth: any = {
        expiresIn: new Date(Date.now() + 1000 * 60 * 60),
        user: { id: -1, email: 'test', name: 'test' },
      };
      jest.spyOn(model, 'findSessionByUserId').mockImplementation(() => auth);
      expect(await service.validateCreds(-1, 'test')).toStrictEqual(auth.user);
    });

    it('should throw error if no auth found', () => {
      jest.spyOn(model, 'findSessionByUserId').mockImplementation(() => null);
      expect(service.validateCreds(-1, 'test')).rejects.toThrow('Unauthorized');
    });

    it('should throw error if auth expired', () => {
      const auth = {
        expiresIn: new Date(Date.now() - 1000 * 60 * 60),
      };
      jest
        .spyOn(model, 'findSessionByUserId')
        .mockImplementation(() => auth as any);
      expect(service.validateCreds(-1, 'test')).rejects.toThrow(
        'Session expired',
      );
    });
  });
  describe('login', () => {
    beforeEach(() => {
      jest.spyOn(model, 'createSession').mockImplementation(async () => null);
    });

    it('should return pair of tokens', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      const user: any = { email: 'test', password: 'test' };
      jest.spyOn(model, 'findByEmail').mockImplementation(async () => user);
      const tokens = { access: 'token', refresh: 'token' };
      jest
        .spyOn(tokenService, 'getPair')
        .mockImplementation(async () => tokens);
      const loginDto = { ...user, deviceId: 'test' };
      expect(await service.login(loginDto)).toStrictEqual(tokens);
    });

    it('should throw error if no user found', () => {
      jest.spyOn(model, 'findByEmail').mockImplementation(async () => null);
      const loginDto = { password: 'test' };
      expect(service.login(loginDto as any)).rejects.toThrow('Unauthorized');
    });

    it('should throw error if password is wrong', () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      const user: any = { email: 'test', password: 'hsdfg235' };
      jest.spyOn(model, 'findByEmail').mockImplementation(async () => user);
      const loginDto = {
        email: user.email,
        deviceId: 'test',
        password: 'wrong',
      };
      expect(service.login(loginDto)).rejects.toThrow('Unauthorized');
    });
  });
});

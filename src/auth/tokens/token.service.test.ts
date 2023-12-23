import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';
import { faker } from '@faker-js/faker';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'mockSecret',
          signOptions: { expiresIn: '60s' },
        }),
        ConfigModule,
      ],
      providers: [TokenService],
    }).compile();

    service = moduleRef.get<TokenService>(TokenService);
    jwtService = moduleRef.get<JwtService>(JwtService);
  });
  describe('parseToken', () => {
    const payload = {
      id: faker.string.nanoid(8),
      deviceId: faker.string.nanoid(10),
    };
    it('should return parsed token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => payload);
      const validToken = faker.string.uuid();
      expect(service.parseToken(validToken)).toStrictEqual(payload);
    });
    describe('should throw bad request err if token is invalid', () => {
      it('invalid secret', async () => {
        jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
          throw new Error();
        });
        const invalidToken = faker.string.uuid();
        expect(() => service.parseToken(invalidToken)).toThrow(
          new BadRequestException('Invalid token'),
        );
      });
      it('should throw bad request err if token is expired', () => {
        jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
          throw new Error();
        });
        const invalidToken = faker.string.uuid();
        expect(() => service.parseToken(invalidToken)).toThrow(
          new BadRequestException('Invalid token'),
        );
      });
    });
  });
  describe('parse auth header', () => {
    it('should return parsed data from token', async () => {
      const result = { id: -1, deviceId: 'test' };
      const token = await jwtService.signAsync(
        { id: -1, deviceId: 'test' },
        { secret: 'mockSec', expiresIn: '360s' },
      );
      jest.spyOn(jwtService, 'verify').mockImplementation(() => result);

      expect(service.parseAuthHeader(`Bearer ${token}`)).toStrictEqual(result);
    });
    it('should throw error if no header provided', () => {
      try {
        service.parseAuthHeader(null);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toBe('Provide authorization');
      }
    });
    it('should throw error if no token provided', () => {
      try {
        service.parseAuthHeader('Bearer');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toBe('Provide token');
      }
    });
  });
  describe('get pair', () => {
    it('should return pair of tokens', async () => {
      const result = { access: 'token', refresh: 'token' };
      jest
        .spyOn(jwtService, 'signAsync')
        .mockImplementation(async () => 'token');

      expect(await service.getPair(-1, 'test')).toStrictEqual(result);
    });
  });
});

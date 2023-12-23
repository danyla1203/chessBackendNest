import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from './jwt.guard';
import { TokenService } from './token.service';
import { AuthService } from '../auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: TokenService,
          useValue: {
            parseAuthHeader: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateCreds: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when token is valid and credentials are valid', async () => {
    jest
      .spyOn(guard['jwtService'], 'parseAuthHeader')
      .mockReturnValue({ id: 'userId', deviceId: '123' });
    jest
      .spyOn(guard['authService'], 'validateCreds')
      .mockResolvedValue({ id: 123, name: 'Test', email: 'no@gmail.com' });

    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: { authorization: 'validToken' },
        }),
      }),
    };

    const result = await guard.canActivate(mockContext as any);
    expect(result).toBe(true);
  });

  it('should throw BadRequestException when token is invalid', async () => {
    jest
      .spyOn(guard['jwtService'], 'parseAuthHeader')
      .mockImplementation(() => {
        throw new Error('Invalid token');
      });
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: { authorization: 'invalidToken' },
        }),
      }),
    };

    await expect(guard.canActivate(mockContext as any)).rejects.toThrowError(
      BadRequestException,
    );
  });
});

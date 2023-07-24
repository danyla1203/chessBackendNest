import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      deviceId: 'deviceId',
    });
  }

  async validate(email, password, deviceId): Promise<User> {
    const user = await this.authService.validateUser({
      email,
      password,
      deviceId,
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

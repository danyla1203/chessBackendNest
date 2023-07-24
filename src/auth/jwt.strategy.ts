import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants';
import { AuthModel } from './model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private model: AuthModel) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    const session = await this.model.findSession(payload.refreshToken);
    if (!session) throw new UnauthorizedException('Invalid session');
    if (session.expiresIn < new Date()) {
      await this.model.deleteSession(session);
      throw new UnauthorizedException('Session expired');
    }
    return payload;
  }
}

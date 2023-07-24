import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';
import { jwtConstants } from './constants';
import { AuthModel } from './model';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private model: AuthModel) {}

  private async getTokens(id: number, deviceId: string) {
    const access = await this.jwtService.signAsync(
      { id, deviceId },
      { secret: jwtConstants.secret, expiresIn: '360s' },
    );
    const refresh = await this.jwtService.signAsync(
      { id, deviceId },
      { secret: jwtConstants.secret, expiresIn: '30d' },
    );
    return { access, refresh };
  }

  async useRefresh(refreshToken: string) {
    const auth = await this.model.findSession(refreshToken);
    if (!auth) throw new UnauthorizedException();
    if (auth.expiresIn < new Date()) {
      await this.model.deleteSession(auth);
      throw new BadRequestException('Session expired');
    }

    const tokens = await this.getTokens(auth.userId, auth.deviceId);
    await this.model.deleteSession(auth);
    await this.model.createSession(auth.userId, tokens.refresh, auth.deviceId);

    return tokens;
  }

  async login(loginData: LoginDto) {
    const user = await this.model.findByEmail(loginData.email);
    if (!user || !bcrypt.compare(loginData.password, user.password)) {
      throw new UnauthorizedException();
    }

    const tokens = await this.getTokens(user.id, loginData.deviceId);

    await this.model.createSession(user.id, tokens.refresh, loginData.deviceId);

    return tokens;
  }
}

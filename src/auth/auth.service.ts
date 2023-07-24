import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';
import { AuthModel } from './model';
import { TokenService } from 'src/tokens/token.service';

@Injectable()
export class AuthService {
  constructor(private tokenService: TokenService, private model: AuthModel) {}

  async useRefresh(refreshToken: string) {
    const auth = await this.model.findSession(refreshToken);
    if (!auth) throw new UnauthorizedException();
    if (auth.expiresIn < new Date()) {
      await this.model.deleteSession(auth.id);
      throw new BadRequestException('Session expired');
    }

    const tokens = await this.tokenService.getPair(auth.userId, auth.deviceId);
    await this.model.deleteSession(auth.id);
    await this.model.createSession(auth.userId, tokens.refresh, auth.deviceId);

    return tokens;
  }

  async validateCreds(id: number, deviceId: string) {
    const auth = await this.model.findSessionByUserId(id, deviceId);
    if (!auth) throw new UnauthorizedException();
    if (auth.expiresIn < new Date()) {
      await this.model.deleteSession(auth.id);
      throw new BadRequestException('Session expired');
    }
    return auth.user;
  }

  async validateUser(loginData: LoginDto) {
    const user = await this.model.findByEmail(loginData.email);
    if (!user || !bcrypt.compare(loginData.password, user.password)) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async login(loginData: LoginDto) {
    const user = await this.model.findByEmail(loginData.email);
    if (!user || !bcrypt.compare(loginData.password, user.password)) {
      throw new UnauthorizedException();
    }

    const tokens = await this.tokenService.getPair(user.id, loginData.deviceId);

    await this.model.createSession(user.id, tokens.refresh, loginData.deviceId);

    return tokens;
  }
}

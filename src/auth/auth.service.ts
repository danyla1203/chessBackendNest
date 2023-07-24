import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';
import { jwtConstants } from './constants';
import { AuthModel } from './model';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private model: AuthModel) {}

  private async getTokens(id: number, email: string) {
    const access = await this.jwtService.signAsync(
      {
        id,
        email,
      },
      { secret: jwtConstants.secret, expiresIn: '360s' },
    );
    const refresh = await this.jwtService.signAsync(
      {
        id,
        email,
      },
      { secret: jwtConstants.secret, expiresIn: '360s' },
    );
    return { access, refresh };
  }

  async login(loginData: LoginDto) {
    const user = await this.model.findByEmail(loginData.email);
    if (!user || !bcrypt.compare(loginData.password, user.password)) {
      throw new UnauthorizedException();
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.model.createSession(user.id, tokens.refresh, loginData.deviceId);

    return tokens;
  }
}

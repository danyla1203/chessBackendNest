import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import { Tokens } from './token.entities';

@Injectable()
export class TokenService {
  oauthGoogle: any;
  jwtSecret: string;
  accessExp: string;
  refreshExp: string;
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const clId = config.get('GOOGLE_CLIENT_ID');
    const googleSecret = config.get('GOOGLE_SECRET');
    const redirect = config.get('GOOGLE_REDIRECT_URL');

    this.oauthGoogle = new google.auth.OAuth2(clId, googleSecret, redirect);

    this.accessExp = config.get('JWT_ACCESS_EXPIRES');
    this.refreshExp = config.get('JWT_REFRESH_EXPIRES');
    this.jwtSecret = config.get('JWT_SECRET');
  }

  public parseToken(token: string) {
    try {
      return this.jwt.verify(token);
    } catch (e) {
      throw new BadRequestException('Invalid token');
    }
  }

  public parseAuthHeader(header?: string) {
    if (!header) throw new BadRequestException('Provide authorization');

    const [_, token] = header.split(' ');
    if (!token) throw new BadRequestException('Provide token');
    return this.parseToken(token);
  }
  public async getPair(id: number, deviceId: string): Promise<Tokens> {
    const access = await this.jwt.signAsync(
      { id, deviceId },
      { secret: this.jwtSecret, expiresIn: this.accessExp },
    );
    const refresh = await this.jwt.signAsync(
      { id, deviceId },
      { secret: this.jwtSecret, expiresIn: this.refreshExp },
    );
    return { access, refresh };
  }
  public async getGoogleUser(code: string) {
    const { tokens } = await this.oauthGoogle.getToken(code);
    this.oauthGoogle.setCredentials(tokens);
    const oauth2 = google.oauth2({
      auth: this.oauthGoogle,
      version: 'v2',
    });
    const { data } = await oauth2.userinfo.get();
    return data;
  }
}

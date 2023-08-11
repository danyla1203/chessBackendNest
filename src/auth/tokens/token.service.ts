import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  oauthGoogle: any;
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const clId = config.get('GOOGLE_CLIENT_ID');
    const secret = config.get('GOOGLE_SECRET');
    const redirect = config.get('GOOGLE_REDIRECT_URL');
    console.log(clId, secret, redirect);
    this.oauthGoogle = new google.auth.OAuth2(clId, secret, redirect);
  }

  public parseAuthHeader(header?: string) {
    if (!header) throw new BadRequestException('Provide authorization');

    const [_, token] = header.split(' ');
    if (!token) throw new BadRequestException('Provide token');
    try {
      return this.jwt.verify(token);
    } catch (e) {
      throw new BadRequestException('Invalid token');
    }
  }
  public async getPair(id: number, deviceId: string) {
    const access = await this.jwt.signAsync(
      { id, deviceId },
      { secret: jwtConstants.secret, expiresIn: '360s' },
    );
    const refresh = await this.jwt.signAsync(
      { id, deviceId },
      { secret: jwtConstants.secret, expiresIn: '30d' },
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

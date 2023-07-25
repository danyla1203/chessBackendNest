import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

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
}

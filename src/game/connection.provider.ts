import { Injectable } from '@nestjs/common';
import { AuthService, TokenService } from '../auth';
import { Anonymous } from './entities/Anonymous';

@Injectable()
export class ConnectionProvider {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokenService,
  ) {}

  private async authorized(payload, client) {
    const { name, id } = await this.authService.validateCreds(
      payload.userId,
      payload.deviceId,
    );
    client.name = name;
    client.authorized = true;
    client.userId = id;
  }
  private anonymousSession(payload, client) {
    client.name = payload.name;
    client.userId = payload.userId;
    client.token = client.handshake.query['Authorization'];
  }
  private async withToken(payload, client) {
    try {
      await this.authorized(payload, client);
    } catch (e) {
      this.anonymousSession(payload, client);
    }
  }

  private anonymousUser() {
    const userId = Math.floor(Math.random() * 100000);
    const { token, exp } = this.tokensService.anonymousToken(userId);
    return new Anonymous(userId, token, exp);
  }
  private anonymous(client) {
    const user: Anonymous = this.anonymousUser();
    client.userId = user.userId;
    client.name = user.name;
    client.token = user.tempToken;
  }
  public async processClient(client) {
    const authToken = client.handshake.query['Authorization'];
    client.authorized = false;
    try {
      const payload = await this.tokensService.parseToken(authToken);
      await this.withToken(payload, client);
    } catch (e) {
      this.anonymous(client);
    }
    return client.authorized
      ? { patch: client, state: 'auth' }
      : { patch: client, state: 'anon' };
  }
}

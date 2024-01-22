import { Injectable } from '@nestjs/common';
import { AuthService, TokenService } from '../auth';
import { Anonymous } from './entities/Anonymous';
import { User } from './EmitTypes';
import { LoggerService } from '../tools/logger';

@Injectable()
export class ConnectionProvider {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokenService,
    private readonly loggingService: LoggerService,
  ) {}

  private async authorized(payload, client) {
    const { name, id } = await this.authService.validateCreds(
      payload.id,
      payload.deviceId,
    );
    client.name = name;
    client.authorized = true;
    client.userId = id;
    this.loggingService.log(
      `Authorized. userId = ${client.userId}, name=${name}`,
      'Ws Connection',
    );
  }
  private anonymousSession(payload, client) {
    client.name = payload.name;
    client.userId = payload.id;
    this.loggingService.log(
      `Anonymous. userId = ${client.userId}`,
      'Ws Connection',
    );
  }
  private async withToken(payload, client) {
    try {
      await this.authorized(payload, client);
    } catch (e) {
      this.anonymousSession(payload, client);
    }
  }

  private anonymousUser() {
    const id = Math.floor(Math.random() * 100000);
    const { token, exp } = this.tokensService.anonymousToken(id);
    return new Anonymous(id, token, exp);
  }
  private anonymous(client) {
    const user: Anonymous = this.anonymousUser();
    client.userId = user.userId;
    client.name = user.name;
    client.token = user.tempToken;
    //TODO: Should patching logic emit a message?
    client.emit(User.anonymousToken, client.token);
    this.loggingService.log(
      `Anonymous. userId = ${client.userId}`,
      'Ws Connection',
    );
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
    return client;
  }
}

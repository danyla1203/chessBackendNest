import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { CreateGameDto } from './dto/CreateGame';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsValidationFilter } from '../tools/WsValidationFilter';
import { GameService } from './game.service';
import { AuthService } from 'src/auth/auth.service';
import { TokenService } from 'src/auth/tokens/token.service';
import { ConnectToGameDto } from './dto/ConnectToGame';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'game' })
@UsePipes(new ValidationPipe())
@UseFilters(new WsValidationFilter())
export class GameGateway implements OnGatewayConnection {
  constructor(
    private readonly service: GameService,
    private readonly authService: AuthService,
    private readonly tokensService: TokenService,
  ) {}

  @WebSocketServer()
  server: Server;

  private makePlayer() {
    return {
      id: Math.floor(Math.random() * 100000),
      name: 'Anonymous',
    };
  }

  async handleConnection(client) {
    const header = client.handshake.headers.authorization;
    try {
      const payload = await this.tokensService.parseAuthHeader(header);
      client.player = await this.authService.validateCreds(
        payload.id,
        payload.deviceId,
      );
    } catch (e) {
      client.player = this.makePlayer();
    }
  }

  @SubscribeMessage('create')
  async createGame(
    @ConnectedSocket() client,
    @MessageBody() config: CreateGameDto,
  ) {
    const { id } = this.service.createGame(client.player, config);
    client.join(`game:${id}`);

    const lobby = this.service.getLobby();
    this.server.emit('lobby:update', lobby);
  }

  @SubscribeMessage('join')
  joinGame(
    @ConnectedSocket() client,
    @MessageBody() { gameId }: ConnectToGameDto,
  ) {
    const { id } = this.service.connectToGame(client.player, gameId);
    client.join(`game:${id}`);
    this.server.to(`game:${id}`).emit('game:start');
  }
}

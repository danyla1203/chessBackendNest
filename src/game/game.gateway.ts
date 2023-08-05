import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsValidationFilter } from '../tools/WsValidationFilter';
import { GameService } from './game.service';
import { AuthService } from 'src/auth/auth.service';
import { TokenService } from 'src/auth/tokens/token.service';
import { ConnectToGameDto, CreateGameDto } from './dto';
import { Client, PlayerSocket } from './entities/Client';

@WebSocketGateway({ namespace: 'game', cors: true, transports: ['websocket'] })
@UsePipes(new ValidationPipe())
@UseFilters(new WsValidationFilter())
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly service: GameService,
    private readonly authService: AuthService,
    private readonly tokensService: TokenService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleDisconnect(client: any) {
    this.service.removeGameInLobby(client);
    const lobby = this.service.getLobby();
    this.server.emit('lobby:update', lobby);
  }

  async handleConnection(client) {
    const header = client.handshake.headers.authorization;
    try {
      const payload = await this.tokensService.parseAuthHeader(header);
      const { name } = await this.authService.validateCreds(
        payload.id,
        payload.deviceId,
      );
      client.name = name;
    } catch (e) {
      client.name = 'Anonymous';
    }
    client.emit('lobby:update', this.service.getLobby());
  }

  @SubscribeMessage('create')
  async createGame(
    @PlayerSocket() player: Client,
    @MessageBody() config: CreateGameDto,
  ) {
    const { id } = this.service.createGame(player, config);
    player.join(`game:${id}`);
    player.emit(`game:created`, { gameId: id });

    const lobby = this.service.getLobby();
    this.server.emit('lobby:update', lobby);
  }

  @SubscribeMessage('join')
  joinGame(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: ConnectToGameDto,
  ) {
    const game = this.service.connectToGame(player, gameId);
    player.join(`game:${game.id}`);

    for (const player of Object.values(game.players)) {
      player.emit('game:init-data', game.getInitedGameData(player.id));
    }
    this.server.to(`game:${game.id}`).emit('game:start');
  }
}

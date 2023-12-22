import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WsValidationFilter } from '../tools/WsValidationFilter';
import { GameService } from './game.service';
import { AuthService, TokenService } from '../auth';
import {
  CompletedMove,
  ConnectToGameDto,
  CreateGameDto,
  TurnBody,
  ChatMessage,
} from './dto';
import { Client, PlayerSocket } from './entities';
import { IsPlayer } from './guards/isplayer.guard';

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
    const authToken = client.handshake.query['Authorization'];
    client.authorized = false;
    try {
      const payload = await this.tokensService.parseToken(authToken);
      const { name, id } = await this.authService.validateCreds(
        payload.id,
        payload.deviceId,
      );
      client.name = name;
      client.authorized = true;
      client.userId = id;
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

    for (const player of game.players) {
      player.emit('game:init-data', game.getInitedGameData(player.id));
    }
    this.server.to(`game:${game.id}`).emit('game:start');
    game.start();
    const lobby = this.service.getLobby();
    this.server.emit('lobby:update', lobby);
  }

  @SubscribeMessage('move')
  @UseGuards(IsPlayer)
  move(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId, figure, cell }: TurnBody,
  ) {
    const game = this.service.findGameById(gameId);
    const { shah, mate, strike }: CompletedMove = game.makeTurn(
      player.id,
      figure,
      cell,
    );

    const actualState = this.service.getActualGameState(game);

    if (shah) this.server.to(`game:${game.id}`).emit('game:shah', shah);
    if (mate) this.server.to(`game:${game.id}`).emit('game:mate', mate);
    if (strike) this.server.to(`game:${game.id}`).emit('game:strike', strike);
    this.server.to(`game:${game.id}`).emit('game:board-update', actualState);
  }

  @SubscribeMessage('chat-message')
  @UseGuards(IsPlayer)
  chatMessage(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId, text }: ChatMessage,
  ) {
    const game = this.service.findGameById(gameId);
    const message = this.service.pushMessage(game, text, player);
    this.server.to(`game:${game.id}`).emit('game:chat-message', message);
  }

  @SubscribeMessage('surrender')
  @UseGuards(IsPlayer)
  async surrender(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const { game, winner, looser } = await this.service.surrender(
      gameId,
      player,
    );
    this.server
      .to(`game:${game.id}`)
      .emit('game:surrender', { winner, looser });
  }

  @SubscribeMessage('draw_purpose')
  @UseGuards(IsPlayer)
  drawPurpose(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const purpose = this.service.purposeDraw(gameId, player);
    player.toRoom(`game:${gameId}`, 'game:draw_purpose', purpose);
  }

  @SubscribeMessage('draw_accept')
  @UseGuards(IsPlayer)
  async acceptPurpose(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    await this.service.acceptDraw(gameId, player);
    this.server.to(`game:${gameId}`).emit('game:draw');
  }

  @SubscribeMessage('draw_reject')
  @UseGuards(IsPlayer)
  rejectPurpose(@MessageBody() { gameId }: { gameId: number }) {
    const result = this.service.rejectDraw(gameId);
    this.server.to(`game:${gameId}`).emit('game:draw_rejected', result);
  }

  @SubscribeMessage('add_time')
  @UseGuards(IsPlayer)
  addTime(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const result = this.service.addTimeToAnotherPlayer(gameId, player);
    this.server.to(`game:${gameId}`).emit('game:time', result);
  }
}

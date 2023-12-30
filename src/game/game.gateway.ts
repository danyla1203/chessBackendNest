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
import { Game, Lobby, room } from './EmitTypes';

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

  handleDisconnect(client: any) {
    this.service.removeGameInLobby(client);
    const lobby = this.service.getLobby();
    this.server.emit(Lobby.update, lobby);
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
    client.emit(Lobby.update, this.service.getLobby());
  }

  @SubscribeMessage('create')
  async createGame(
    @PlayerSocket() player: Client,
    @MessageBody() config: CreateGameDto,
  ) {
    const { id } = this.service.createGame(player, config);
    player.join(room(id));
    player.emit(Game.created, { gameId: id });

    const lobby = this.service.getLobby();
    this.server.emit(Lobby.update, lobby);
  }

  @SubscribeMessage('join')
  joinGame(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: ConnectToGameDto,
  ) {
    const game = this.service.connectToGame(player, gameId);
    player.join(room(game.id));

    for (const player of game.players) {
      player.emit(Game.init, game.getInitedGameData(player.id));
    }
    this.server.to(room(game.id)).emit(Game.start);
    game.start();
    const lobby = this.service.getLobby();
    this.server.emit(Lobby.update, lobby);
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

    if (shah) this.server.to(room(game.id)).emit(Game.shah, shah);
    if (mate) this.server.to(room(game.id)).emit(Game.mate, mate);
    if (strike) this.server.to(room(game.id)).emit(Game.strike, strike);
    this.server.to(room(game.id)).emit(Game.boardUpdate, actualState);
  }

  @SubscribeMessage('chat-message')
  @UseGuards(IsPlayer)
  chatMessage(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId, text }: ChatMessage,
  ) {
    const game = this.service.findGameById(gameId);
    const message = this.service.pushMessage(game, text, player);
    this.server.to(room(game.id)).emit(Game.message, message);
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
    this.server.to(room(game.id)).emit(Game.surrender, { winner, looser });
  }

  @SubscribeMessage('draw_purpose')
  @UseGuards(IsPlayer)
  drawPurpose(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const purpose = this.service.purposeDraw(gameId, player);
    player.toRoom(room(gameId), Game.drawPurpose, purpose);
  }

  @SubscribeMessage('draw_accept')
  @UseGuards(IsPlayer)
  async acceptPurpose(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    await this.service.acceptDraw(gameId, player);
    this.server.to(room(gameId)).emit(Game.draw);
  }

  @SubscribeMessage('draw_reject')
  @UseGuards(IsPlayer)
  rejectPurpose(@MessageBody() { gameId }: { gameId: number }) {
    const result = this.service.rejectDraw(gameId);
    this.server.to(room(gameId)).emit(Game.rejectDraw, result);
  }

  @SubscribeMessage('add_time')
  @UseGuards(IsPlayer)
  addTime(
    @PlayerSocket() player: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const result = this.service.addTimeToAnotherPlayer(gameId, player);
    this.server.to(room(gameId)).emit(Game.addTime, result);
  }
}

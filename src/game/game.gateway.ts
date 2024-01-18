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
import { ConnectToGameDto, CreateGameDto, TurnBody, ChatMessage } from './dto';
import { Client, ClientSocket } from './entities';
import { IsPlayer } from './guards/isplayer.guard';
import { Game, Lobby, User, room } from './EmitTypes';
import { Anonymous } from './entities/Anonymous';
import { LoggerService } from '../tools/logger';

@WebSocketGateway({ namespace: 'game', cors: true, transports: ['websocket'] })
@UsePipes(new ValidationPipe())
@UseFilters(new WsValidationFilter())
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly service: GameService,
    private readonly authService: AuthService,
    private readonly tokensService: TokenService,
    private readonly loggingService: LoggerService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleDisconnect(client: Client) {
    this.service.removeGameInLobby(client);
    const opponent = this.service.playerLeaveEvent(client);
    if (opponent) {
      opponent.emit(Game.playerLeave, {
        opponent: { id: opponent.id, name: opponent.name, side: opponent.side },
      });
    }
    const lobby = this.service.getLobby();
    this.server.emit(Lobby.update, lobby);
  }

  public async connWithToken(payload, client: Client) {
    try {
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
    } catch (e) {
      client.name = payload.name;
      client.userId = payload.id;
      this.loggingService.log(
        `Anonymous. userId = ${client.userId}`,
        'Ws Connection',
      );
    }
  }
  public createAnonymousConn(client) {
    const user: Anonymous = this.service.anonymousUser();
    client.userId = user.userId;
    client.name = user.name;
    client.token = user.tempToken;
    client.emit(User.anonymousToken, client.token);
    this.loggingService.log(
      `Anonymous. userId = ${client.userId}`,
      'Ws Connection',
    );
  }

  async handleConnection(client) {
    const authToken = client.handshake.query['Authorization'];
    client.authorized = false;
    try {
      const payload = await this.tokensService.parseToken(authToken);
      await this.connWithToken(payload, client);
    } catch (e) {
      this.createAnonymousConn(client);
    }
    const game = this.service.findPendingGame(client);
    if (game) {
      client.emit(Game.pendingGame, { gameId: game.id });
      this.service.updateSocket(client, game);
    }

    client.emit(Lobby.update, this.service.getLobby());
  }

  @SubscribeMessage('create')
  async createGame(
    @ClientSocket() client: Client,
    @MessageBody() config: CreateGameDto,
  ) {
    const { id } = this.service.createGame(client, config);
    client.join(room(id));
    client.emit(Game.created, { gameId: id });

    const lobby = this.service.getLobby();
    this.server.emit(Lobby.update, lobby);
  }

  @SubscribeMessage('rejoin')
  rejoinGame(
    @ClientSocket() client: Client,
    @MessageBody() { gameId }: ConnectToGameDto,
  ) {
    const game = this.service.findPendingUserGame(gameId, client.userId);
    client.join(room(game.id));
    client.emit(Game.init, game.getInitedGameData(client.userId));
    this.server.to(room(game.id)).emit(Game.playerReconected, {
      opponent: {
        id: client.id,
        name: client.name,
      },
    });
  }

  @SubscribeMessage('join')
  joinGame(
    @ClientSocket() client: Client,
    @MessageBody() { gameId }: ConnectToGameDto,
  ) {
    const game = this.service.connectToGame(client, gameId);
    client.join(room(game.id));

    for (const player of game.players) {
      player.emit(Game.init, game.getInitedGameData(player.userId));
    }
    this.server.to(room(game.id)).emit(Game.start);
    game.start();
    const lobby = this.service.getLobby();
    this.server.emit(Lobby.update, lobby);
  }

  @SubscribeMessage('move')
  @UseGuards(IsPlayer)
  move(
    @ClientSocket() client: Client,
    @MessageBody() { gameId, figure, cell }: TurnBody,
  ) {
    const game = this.service.findGameById(gameId);
    const { result, prevCell, side } = game.makeTurn(
      client.userId,
      figure,
      cell,
    );
    const { shah, mate, strike } = result;
    if (shah) this.server.to(room(game.id)).emit(Game.shah, shah);
    if (mate) this.server.to(room(game.id)).emit(Game.mate, mate);
    if (strike) this.server.to(room(game.id)).emit(Game.strike, strike);
    this.server
      .to(room(game.id))
      .emit(Game.boardUpdate, { figure, cell, prevCell, side });
  }

  @SubscribeMessage('chat-message')
  @UseGuards(IsPlayer)
  chatMessage(
    @ClientSocket() client: Client,
    @MessageBody() { gameId, text }: ChatMessage,
  ) {
    const game = this.service.findGameById(gameId);
    const message = this.service.pushMessage(game, text, client);
    this.server.to(room(game.id)).emit(Game.message, message);
  }

  @SubscribeMessage('surrender')
  @UseGuards(IsPlayer)
  async surrender(
    @ClientSocket() client: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const { game, winner, looser } = await this.service.surrender(
      gameId,
      client,
    );
    this.server.to(room(game.id)).emit(Game.surrender, { winner, looser });
  }

  @SubscribeMessage('draw_purpose')
  @UseGuards(IsPlayer)
  drawPurpose(
    @ClientSocket() client: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const purpose = this.service.purposeDraw(gameId, client);
    client.toRoom(room(gameId), Game.drawPurpose, purpose);
  }

  @SubscribeMessage('draw_accept')
  @UseGuards(IsPlayer)
  async acceptPurpose(
    @ClientSocket() client: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    await this.service.acceptDraw(gameId, client);
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
    @ClientSocket() client: Client,
    @MessageBody() { gameId }: { gameId: number },
  ) {
    const result = this.service.addTimeToAnotherPlayer(gameId, client);
    this.server.to(room(gameId)).emit(Game.addTime, result);
  }
}

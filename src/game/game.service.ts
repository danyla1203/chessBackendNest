import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateGameDto,
  PlainBoardState,
  TimeUpdate,
  DrawAgreement,
} from './dto';
import { GameList } from './game.list';
import { Client, Player } from './entities';
import {
  Game,
  GameData,
  FiguresCellState,
  Message,
  GameResult,
} from './entities/game';
import { GameModel } from './model';
import { GameWithWinner, DrawGame } from './entities/game/game.types';

@Injectable()
export class GameService {
  constructor(
    private readonly list: GameList,
    private readonly model: GameModel,
  ) {}

  private async injectableSaveGame(
    pl1: Player,
    pl2: Player,
    result: GameResult,
    winner = false,
  ) {
    this.list.gameEnd(result.id);
    if (!pl1.authorized || !pl2.authorized) return null;
    return winner
      ? await this.model.saveGameWithWinner({
          ...result,
          winner: pl1,
          looser: pl2,
        })
      : await this.model.saveDraw({ ...result, pl1, pl2 });
  }

  public createGame(player: Client, config: CreateGameDto): Game {
    const newGame = new Game(
      player,
      config,
      this.injectableSaveGame.bind(this),
    );
    this.list.addGameToLobby(newGame);
    return newGame;
  }

  public connectToGame(player: Client, gameId: number): Game {
    const game = this.list.findInLobby(gameId);
    if (!game) throw new NotFoundException('Game not found');
    const pl1 = game.players[0];
    if (player.userId && pl1.userId === player.userId) {
      throw new ConflictException('You are already in game');
    }

    game.addPlayer(player);
    this.list.pushToStartedGames(gameId);

    return game;
  }

  public removeInitedGamesBy(player: Client): void {
    this.list.removeInitedGames(player);
  }
  public findCurrentOpponent(player: Client): Player {
    const game = this.list.findPendingClientGame(player);
    if (!game) return;

    return game.players.find((pl) => pl.userId !== player.userId);
  }

  //TODO: How can i combine two similar methods below
  public findPendingGame(client): Game | null {
    return this.list.findPendingClientGame(client);
  }
  public findPendingGameThrowable(client: Client): never | Game {
    const game = this.list.findPendingClientGame(client);
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }
  public leaveGame(client: Client) {
    const game = this.list.findPendingClientGame(client);
    if (!game) throw new NotFoundException('Game not found');

    const [pl1, pl2] = game.players;
    const winner = pl1.userId !== client.userId ? pl1 : pl2;
    const looser = pl1.userId === client.userId ? pl1 : pl2;
    return game.endGame(winner, looser);
  }
  public updateSocket(socket, game: Game): Player {
    const adaptedSocket = {
      id: socket.id,
      authorized: socket.authorized,
      name: socket.name,
      userId: socket.userId,
      join: socket.join.bind(socket),
      emit: socket.emit.bind(socket),
      toRoom: (room: string, event: string, data: any) => {
        socket.to(room).emit(event, data);
      },
    };
    const newPlayer = game.resetPlayer(adaptedSocket);
    game.resetTicking();
    return newPlayer;
  }

  public getLobby(): GameData[] {
    return this.list.lobby.map((game) => game.data);
  }
  public findGameById(id: number): Game {
    const game = this.list.games.find((game) => game.id === id);
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  public pendingGameData(game) {
    return this.getActualGameState(game);
  }

  public getActualGameState(game: Game): PlainBoardState {
    const boards: FiguresCellState = game.process.state;

    const plainObj = {
      w: {},
      b: {},
    };

    const [white, black] = Object.values(boards);
    for (const [figure, cell] of white.entries()) {
      plainObj.w[cell] = figure;
    }
    for (const [figure, cell] of black.entries()) {
      plainObj.b[cell] = figure;
    }

    return plainObj;
  }

  public pushMessage(game: Game, message: string, player: Client): Message {
    return game.chat.addMessage(message, player);
  }

  public async surrender(
    gameId: number,
    client: Client,
  ): Promise<GameWithWinner> {
    const game = this.findGameById(gameId);
    const [pl1, pl2] = game.players;
    const winner = pl1.userId !== client.userId ? pl1 : pl2;
    const looser = pl1.userId === client.userId ? pl1 : pl2;

    return game.endGame(winner, looser);
  }

  public purposeDraw(gameId: number, client: Client): DrawAgreement {
    const game = this.findGameById(gameId);
    const { side } = game.players.find((pl) => pl.userId === client.userId);
    if (game.draw[side]) throw new ConflictException('Purpose already set');
    game.setDrawPurposeFrom(side);
    return game.draw;
  }

  public async acceptDraw(gameId: number, client: Client): Promise<DrawGame> {
    const game = this.findGameById(gameId);
    const { w, b } = game.draw;
    const { side } = game.players.find((pl) => pl.userId === client.userId);

    if (!w && !b) throw new ConflictException('Draw purpose wasnt set');

    game.setDrawPurposeFrom(side);
    return game.endGameByDraw();
  }

  public rejectDraw(gameId: number): DrawAgreement {
    const game = this.findGameById(gameId);
    const { w, b } = game.draw;

    if (!w && !b) throw new ConflictException('Draw purpose wasnt set');

    game.rejectDraw();
    return { w: false, b: false };
  }

  public addTimeToAnotherPlayer(gameId: number, player: Client): TimeUpdate {
    const game = this.findGameById(gameId);
    const players = game.players;
    const toPlayer = players.find((pl) => pl.userId !== player.userId);
    game.addTimeTo(toPlayer, game.config.timeIncrement);

    return {
      [players[0].side]: players[0].time,
      [players[1].side]: players[1].time,
    };
  }
}

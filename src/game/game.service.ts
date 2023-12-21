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
    this.list.removeGameFromLobby(gameId);

    return game;
  }

  public removeGameInLobby(player: Client): void {
    this.list.removeGameFromLobbyByPlayer(player);
  }

  public getLobby(): GameData[] {
    return this.list.lobby.map((game) => game.data);
  }
  public findGameById(id: number): Game {
    const game = this.list.games.find((game) => game.id === id);
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  public getActualGameState(game: Game): PlainBoardState {
    const boards: FiguresCellState = game.process.state;

    const plainObj = {
      white: {},
      black: {},
    };

    const [white, black] = Object.values(boards);
    for (const [figure, cell] of white.entries()) {
      plainObj.white[figure] = cell;
    }
    for (const [figure, cell] of black.entries()) {
      plainObj.black[figure] = cell;
    }

    return plainObj;
  }

  public pushMessage(game: Game, message: string, player: Client): Message {
    return game.chat.addMessage(message, player);
  }

  public async surrender(
    gameId: number,
    client: Client,
  ): Promise<{ game: Game; winner: Player; looser: Player }> {
    const game = this.findGameById(gameId);
    const [pl1, pl2] = game.players;
    const winner = pl1.id !== client.id ? pl1 : pl2;
    const looser = pl1.id === client.id ? pl1 : pl2;

    await game.endGame(winner, looser);
    return { game, winner, looser };
  }

  public purposeDraw(gameId: number, client: Client): DrawAgreement {
    const game = this.findGameById(gameId);
    const player = game.players.find((pl) => pl.id === client.id);
    if (game.draw[player.side])
      throw new ConflictException('Draw purpose already set');
    game.setDrawPurposeFrom(player);
    const purpose =
      player.side === 'w' ? { w: true, b: false } : { w: false, b: true };

    return purpose;
  }

  public async acceptDraw(
    gameId: number,
    client: Client,
  ): Promise<DrawAgreement> {
    const game = this.findGameById(gameId);
    const draw = game.draw;
    const player = game.players.find((pl) => pl.id === client.id);

    if (!draw.w && !draw.b)
      throw new ConflictException('Draw purpose wasnt set');

    game.setDrawPurposeFrom(player);
    await game.endGameByDraw();

    return { w: true, b: true };
  }

  public rejectDraw(gameId: number): DrawAgreement {
    const game = this.findGameById(gameId);
    const draw = game.draw;

    if (!draw.w && !draw.b)
      throw new ConflictException('Draw purpose wasnt set');

    game.rejectDraw();
    return { w: false, b: false };
  }

  public addTimeToAnotherPlayer(gameId: number, player: Client): TimeUpdate {
    const game = this.findGameById(gameId);
    const players = game.players;
    const toPlayer = players.find((pl) => pl.id !== player.id);
    game.addTimeTo(toPlayer, game.config.timeIncrement);

    return {
      [players[0].side]: players[0].time,
      [players[1].side]: players[1].time,
    };
  }
}

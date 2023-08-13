import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGameDto } from './dto';
import { GameList } from './game.list';
import { Game, Client, FiguresCellState } from './entities';
import { Player } from './entities/Player';

@Injectable()
export class GameService {
  constructor(private readonly list: GameList) {}

  public createGame(player: Client, config: CreateGameDto) {
    const newGame = new Game(player, config);
    this.list.addGameToLobby(newGame);
    return newGame;
  }

  public connectToGame(player: Client, gameId: number) {
    const game = this.list.findInLobby(gameId);
    if (!game) throw new NotFoundException('Game not found');
    if (player.id in game.players)
      throw new ConflictException('You are already in this game');

    game.addPlayer(player);
    this.list.removeGameFromLobby(gameId);

    return game;
  }

  public removeGameInLobby(player: Client) {
    this.list.removeGameFromLobbyByPlayer(player);
  }

  public getLobby() {
    return this.list.lobby.map((game) => game.getGameData());
  }
  public findGameById(id: number) {
    const game = this.list.games.find((game) => game.id === id);
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  public getActualGameState(game: Game) {
    const boards: FiguresCellState = game.process.state;

    const plainObj: { [key: string]: { [key: string]: string } } = {
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

  public pushMessage(game: Game, message: string, player: Client) {
    return game.chat.addMessage(message, player);
  }

  public surrender(gameId: number, client: Client) {
    const game = this.findGameById(gameId);
    const winner = Object.values(game.players).find(
      (pl) => pl.id !== client.id,
    );
    const player = game.players[client.id];
    game.endGame(winner, player);
    return { game, winner, looser: player };
  }

  public purposeDraw(
    gameId: number,
    client: Client,
  ): { w: boolean; b: boolean } {
    const game = this.findGameById(gameId);
    const player = game.players[client.id];
    game.setDrawPurpose(player);
    const purpose =
      player.side === 'w' ? { w: true, b: false } : { w: false, b: true };

    return purpose;
  }

  public acceptDraw(gameId: number, client: Client): { w: true; b: true } {
    const game = this.findGameById(gameId);
    const draw = game.draw;
    const player = game.players[client.id];

    if (draw[player.side]) throw new ConflictException('Draw already set');
    if (!draw.w && !draw.b) throw new ConflictException('Draw purpose not set');

    game.setDrawPurpose(player);
    game.endGameByDraw();
    return { w: true, b: true };
  }

  public rejectDraw(gameId: number): { w: false; b: false } {
    const game = this.findGameById(gameId);
    const draw = game.draw;

    if (!draw.w && !draw.b) throw new ConflictException('Draw purpose not set');

    game.rejectDraw();
    return { w: false, b: false };
  }

  public addTime(gameId: number, player: Client) {
    const game = this.findGameById(gameId);
    const targetPlayer = Object.values(game.players).find(
      (pl) => pl.id !== player.id,
    );
    game.addTime(targetPlayer, game.config.timeIncrement);

    const pl1 = game.players[targetPlayer.id];
    const pl2 = game.players[player.id];

    return { [pl1.side]: pl1.time, [pl2.side]: pl2.time };
  }
}

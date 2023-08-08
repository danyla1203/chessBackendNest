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

  public pushMessage(game: Game, message: string, player: Player) {
    return game.chat.addMessage(message, player);
  }
}

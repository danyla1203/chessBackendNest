import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGameDto } from './dto/CreateGame';
import { GameList } from './game.list';
import { Game } from './entities/game';
import { Client } from './entities/Client';

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
    game.start();

    return game;
  }

  public removeGameInLobby(player: Client) {
    this.list.removeGameFromLobbyByPlayer(player);
  }

  public getLobby() {
    return this.list.lobby.map((game) => game.getGameData());
  }
}

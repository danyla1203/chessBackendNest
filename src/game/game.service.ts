import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/CreateGame';
import { GameList } from './game.list';
import { Game } from './game.entity';

@Injectable()
export class GameService {
  constructor(private readonly list: GameList) {}

  public createGame(player, config: CreateGameDto) {
    const newGame = new Game(player, config);
    this.list.addGameToLobby(newGame);
    return newGame;
  }

  public connectToGame(player, gameId: number) {
    const game = this.list.findInLobby(gameId);
    if (!game) throw new NotFoundException('Game not found');

    game.addPlayer(player);
    game.start();

    return game;
  }
  public getLobby() {
    return this.list.lobby;
  }
}

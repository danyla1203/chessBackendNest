import { Injectable } from '@nestjs/common';
import { Game } from './game.entity';

@Injectable()
export class GameList {
  lobby: Game[];
  games: Game[];

  constructor() {
    this.lobby = [];
    this.games = [];
  }

  addGameToLobby(game: Game) {
    this.lobby.push(game);
  }
  findInLobby(id: number) {
    return this.lobby.find((game) => game.id === id);
  }
}

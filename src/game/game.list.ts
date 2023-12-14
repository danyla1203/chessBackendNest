import { Injectable } from '@nestjs/common';
import { Game } from './entities/game';
import { Client } from './entities';

@Injectable()
export class GameList {
  lobby: Game[];
  games: Game[];

  constructor() {
    this.lobby = [];
    this.games = [];
  }

  public addGameToLobby(game: Game): void {
    this.lobby.push(game);
  }
  public findInLobby(id: number): Game {
    return this.lobby.find((game) => game.id === id);
  }

  public removeGameFromLobby(gameId: number): void {
    const index: number = this.lobby.findIndex(
      (game: Game) => game.id === gameId,
    );
    this.games.push(this.lobby[index]);
    this.lobby.splice(index, 1);
  }
  public removeGameFromLobbyByPlayer(client: Client): void {
    this.lobby = this.lobby.filter((game) => {
      return !(client.id in game.players);
    });
  }
}

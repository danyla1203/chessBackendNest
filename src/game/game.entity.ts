import { Socket } from 'socket.io';

type Config = {
  side: string;
  time: string;
  timeIncrement: string;
};

export class Game {
  id: number;
  players: Socket[];
  config: Config;
  isActive: boolean;
  constructor(player: Socket, config: Config) {
    this.id = Math.floor(Math.random() * 100000);
    this.players = [player];
    this.config = config;
    this.isActive = false;
  }

  addPlayer(player: Socket) {
    this.players.push(player);
  }

  start() {
    this.isActive = true;
  }
}

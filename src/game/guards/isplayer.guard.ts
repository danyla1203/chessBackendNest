import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GameService } from '../game.service';

@Injectable()
export class IsPlayer implements CanActivate {
  constructor(private readonly service: GameService) {}

  canActivate(context: ExecutionContext): boolean {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    const gameId = wsContext.getData().gameId;

    const game = this.service.findGameById(gameId);

    return !!game.players.find((pl) => pl.id === client.id);
  }
}

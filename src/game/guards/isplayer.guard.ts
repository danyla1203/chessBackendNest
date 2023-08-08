import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GameService } from '../game.service';

@Injectable()
export class IsPlayer implements CanActivate {
  constructor(private readonly service: GameService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    const gameId = wsContext.getData().gameId;

    const game = this.service.findGameById(gameId);
    if (client.id in game.players) return true;
    return false;
  }
}
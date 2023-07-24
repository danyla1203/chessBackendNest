import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: TokenService,
    private readonly authService: AuthService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    try {
      const payload = this.jwtService.parseAuthHeader(authorization);
      request.user = this.authService.validateCreds(
        payload.id,
        payload.deviceId,
      );
      return true;
    } catch (e) {
      throw new BadRequestException('Invalid token');
    }
  }
}

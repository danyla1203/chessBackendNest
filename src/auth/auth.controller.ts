import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseRefreshDto } from './dto/UseRefresh';
import { AuthGuard } from 'src/auth/tokens/jwt.guard';
import { LoginDto } from './dto/Login';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() loginData: LoginDto) {
    return this.authService.login(loginData);
  }

  @Put('use-refresh')
  useRefresh(@Body() { refreshToken }: UseRefreshDto) {
    return this.authService.useRefresh(refreshToken);
  }

  @Delete('logout')
  @UseGuards(AuthGuard)
  async logout(@Request() req) {
    await this.authService.logout(req.user.id, req.user.deviceId);
    return { message: 'ok' };
  }
}

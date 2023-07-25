import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseRefreshDto } from './dto/UseRefresh';
import { AuthGuard } from 'src/auth/tokens/jwt.guard';
import { LoginDto } from './dto/Login';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginData: LoginDto) {
    return this.authService.login(loginData);
  }

  @Post('use-refresh')
  async useRefresh(@Body() { refreshToken }: UseRefreshDto) {
    return this.authService.useRefresh(refreshToken);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

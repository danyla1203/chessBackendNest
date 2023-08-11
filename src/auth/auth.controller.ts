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

  @Post('send-verification-mail')
  sendVerificationMail(@Body() { email }: { email: string }) {
    return this.authService.sendVerificationMail(email);
  }
  @Post('verify-email')
  sendVerificationCode(
    @Body() { code, email }: { code: string; email: string },
  ) {
    return this.authService.verifyEmail(code, email);
  }
  @Post('/google/oauth')
  googleOAuth(@Body() { code }: { code: string }) {
    return this.authService.googleOAuth(code);
  }
}

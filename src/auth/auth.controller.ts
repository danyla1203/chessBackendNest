import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  UseRefreshDto,
  LoginDto,
  VerifyEmail,
  SendVerificationMail,
  GoogleCode,
} from './dto';
import { AuthGuard, AuthService } from '.';
import { LoggerService } from '../tools/logger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: LoggerService,
  ) {}

  @Post('login')
  login(@Body() loginData: LoginDto) {
    this.logger.log('Login', 'AuthController');
    return this.authService.login(loginData);
  }

  @Put('use-refresh')
  useRefresh(@Body() { refreshToken }: UseRefreshDto) {
    this.logger.log('Use refresh token - update session', 'AuthController');
    return this.authService.useRefresh(refreshToken);
  }

  @Delete('logout')
  @UseGuards(AuthGuard)
  async logout(@Request() req) {
    this.logger.log('Logout', 'AuthController');
    await this.authService.logout(req.user.id, req.user.deviceId);
    return { message: 'ok' };
  }

  @Post('send-verification-mail')
  sendVerificationMail(@Body() { email }: SendVerificationMail) {
    this.logger.log('Send verification email', 'AuthController');
    return this.authService.sendVerificationMail(email);
  }
  @Patch('verify-email')
  sendVerificationCode(@Body() { code, email }: VerifyEmail) {
    this.logger.log('Verify email by code', 'AuthController');
    return this.authService.verifyEmail(code, email);
  }
  @Post('/google/oauth')
  googleOAuth(@Body() { code }: GoogleCode) {
    this.logger.log('Google OAuth by code', 'AuthController');
    return this.authService.googleOAuth(code);
  }
}

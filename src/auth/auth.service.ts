import {
  BadRequestException as BadRequest,
  ConflictException as Conflict,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';
import { AuthModel } from './model';
import { TokenService } from './tokens/token.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private model: AuthModel,
    private mailService: MailService,
  ) {}

  async sendVerificationMail(email: string) {
    const isUserExist = await this.model.findUserByEmail(email);
    if (isUserExist) throw new Conflict('User already exists');

    const code = Math.floor(Math.random() * 1000000);
    const [response] = await this.mailService.sendVerificationMail(code, email);
    if (response.statusCode !== 202) {
      throw new BadRequest('Mail not sent');
    }
    const confirmation = await this.model.findConfirmation(email);
    if (!confirmation) {
      await this.model.createConfirmation(code, email);
    } else {
      await this.model.changeConfirmationCode(confirmation.id, code);
    }
    return { message: 'ok', email };
  }
  async verifyEmail(code: string, email: string) {
    const confirmation = await this.model.findConfirmation(email);
    if (!confirmation) throw new BadRequest('Invalid email');
    if (confirmation.code !== code) throw new BadRequest('Invalid code');

    await this.model.confirmConfirmation(email);

    return { message: 'ok' };
  }

  async useRefresh(refreshToken: string) {
    const auth = await this.model.findSession(refreshToken);
    if (!auth) throw new UnauthorizedException();
    if (auth.expiresIn < new Date()) {
      await this.model.deleteSession(auth.id);
      throw new BadRequest('Session expired');
    }

    const tokens = await this.tokenService.getPair(auth.userId, auth.deviceId);
    await this.model.deleteSession(auth.id);
    await this.model.createSession(auth.userId, tokens.refresh, auth.deviceId);

    return tokens;
  }

  async createSession(id: number, deviceId: string) {
    const tokens = await this.tokenService.getPair(id, deviceId);

    await this.model.createSession(id, tokens.refresh, deviceId);

    return tokens;
  }

  async validateCreds(id: number, deviceId: string) {
    const auth = await this.model.findSessionByUserId(id, deviceId);
    if (!auth) throw new UnauthorizedException();
    if (auth.expiresIn < new Date()) {
      await this.model.deleteSession(auth.id);
      throw new BadRequest('Session expired');
    }
    return auth.user;
  }

  async login(loginData: LoginDto) {
    const user = await this.model.findUserByEmail(loginData.email);
    if (!user) throw new UnauthorizedException();

    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password,
    );
    if (!isPasswordValid) throw new UnauthorizedException();

    const tokens = await this.tokenService.getPair(user.id, loginData.deviceId);

    await this.model.createSession(user.id, tokens.refresh, loginData.deviceId);

    return tokens;
  }
  async logout(id: number, deviceId: string) {
    await this.model.deleteSessionByUserId(id, deviceId);
  }
}

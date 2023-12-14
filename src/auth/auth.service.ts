import {
  BadRequestException as BadRequest,
  ConflictException as Conflict,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto';
import { AuthModel } from './model';
import { TokenService } from './tokens/token.service';
import { UserFields } from 'src/user/entities/user.entity';
import { Tokens } from './tokens/token.entities';

@Injectable()
export class AuthService {
  constructor(private tokenService: TokenService, private model: AuthModel) {}

  public async sendVerificationMail(
    email: string,
  ): Promise<{ message: 'ok'; email: string; code: number }> {
    const isUserExist = await this.model.findUserByEmail(email);
    if (isUserExist) throw new Conflict('User already exists');

    const code = Math.floor(Math.random() * 1000000);
    // INFO: Disable sendgrid mailing service for development purpose
    // const [response] = await this.mailService.sendVerificationMail(code, email);
    // if (response.statusCode !== 202) {
    //   throw new BadRequest('Mail not sent');
    // }
    const confirmation = await this.model.findConfirmation(email);
    if (!confirmation) {
      await this.model.createConfirmation(code, email);
    } else {
      await this.model.changeConfirmationCode(confirmation.id, code);
    }
    // INFO: Returning code, while sendgrid mailing is disabled
    return { message: 'ok', email, code };
  }
  public async verifyEmail(
    code: string,
    email: string,
  ): Promise<{ message: 'ok' }> {
    const confirmation = await this.model.findConfirmation(email);
    if (!confirmation) throw new BadRequest('Invalid email');
    if (confirmation.code !== code) throw new BadRequest('Invalid code');

    await this.model.confirmConfirmation(email);

    return { message: 'ok' };
  }

  public async useRefresh(refreshToken: string): Promise<Tokens> {
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

  public async createSession(id: number, deviceId: string): Promise<Tokens> {
    const tokens = await this.tokenService.getPair(id, deviceId);

    await this.model.createSession(id, tokens.refresh, deviceId);

    return tokens;
  }

  public async validateCreds(
    id: number,
    deviceId: string,
  ): Promise<UserFields> {
    const auth = await this.model.findSessionByUserId(id, deviceId);
    if (!auth) throw new UnauthorizedException();
    if (auth.expiresIn < new Date()) {
      await this.model.deleteSession(auth.id);
      throw new BadRequest('Session expired');
    }
    return auth.user;
  }

  public async login(loginData: LoginDto): Promise<Tokens> {
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
  public async logout(id: number, deviceId: string) {
    await this.model.deleteSessionByUserId(id, deviceId);
  }

  public async googleOAuth(code: string) {
    const { email } = await this.tokenService.getGoogleUser(code);
    const user = await this.model.findUserByEmail(email);
    if (!user) {
      const confirmation = await this.model.findConfirmation(email);
      if (!confirmation) await this.model.createConfirmation(-1, email, true);
      return { message: 'ok', email };
    } else {
      const tokens = await this.tokenService.getPair(
        user.id,
        'google-' + user.id,
      );
      await this.model.createSession(
        user.id,
        tokens.refresh,
        'google-' + user.id,
      );
      return tokens;
    }
  }
}

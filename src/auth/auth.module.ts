import { Global, Module } from '@nestjs/common';
import { AuthService } from '.';
import { PrismaService } from 'src/prisma.service';
import { AuthController } from './auth.controller';
import { AuthModel } from './model';
import { TokenModule } from './tokens/tokens.module';
import { MailService } from '../mail/mail.service';

@Global()
@Module({
  imports: [TokenModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, AuthModel, MailService],
  exports: [AuthService, TokenModule],
})
export class AuthModule {}

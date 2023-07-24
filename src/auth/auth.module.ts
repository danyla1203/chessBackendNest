import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { AuthController } from './auth.controller';
import { AuthModel } from './model';
import { TokenModule } from 'src/tokens/tokens.module';

@Module({
  imports: [TokenModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, AuthModel],
  exports: [AuthService, TokenModule],
})
export class AuthModule {}

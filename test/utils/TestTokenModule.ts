import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../../src/auth/tokens/constants';
import { TokenService } from '../../src/auth/tokens/token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
    ConfigModule,
  ],
  controllers: [],
  providers: [TokenService],
  exports: [TokenService],
})
export class TestTokenModule {}

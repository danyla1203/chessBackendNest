import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../../src/auth/tokens/token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'mockSecret',
      signOptions: { expiresIn: '60s' },
    }),
    ConfigModule,
  ],
  controllers: [],
  providers: [TokenService],
  exports: [TokenService],
})
export class TestTokenModule {}

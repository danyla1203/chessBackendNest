import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserModel } from './model';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserModel, PrismaService],
})
export class UserModule {}

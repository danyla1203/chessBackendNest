import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto';

const userFields = {
  id: true,
  name: true,
  email: true,
};

@Injectable()
export class UserModel {
  constructor(private readonly prisma: PrismaService) {}

  createUser(user: CreateUserDto) {
    return this.prisma.user.create({
      select: userFields,
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });
  }

  findConfirmation(email: string) {
    return this.prisma.confirmations.findUnique({ where: { email } });
  }

  findProfile(id: number) {
    return this.prisma.user.findUnique({
      select: userFields,
      where: { id },
    });
  }
  findProfileByEmail(email: string) {
    return this.prisma.user.findUnique({
      select: userFields,
      where: { email },
    });
  }

  updateUser(id: number, name: string) {
    return this.prisma.user.update({
      select: userFields,
      where: { id },
      data: { name },
    });
  }

  findUserGames(id: number) {
    return this.prisma.game.findMany({
      select: {
        id: true,
        maxTime: true,
        timeIncrement: true,
        sideSelecting: true,
        isDraw: true,
        moves: true,
        players: {
          select: {
            userId: true,
            side: true,
            isWinner: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
      where: { players: { some: { userId: id } } },
      orderBy: { id: 'asc' },
    });
  }
}

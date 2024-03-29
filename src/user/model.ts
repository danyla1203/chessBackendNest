import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto';
import { Confirmation } from '@prisma/client';
import { UserFields, UserGames, userFields } from './entities';

@Injectable()
export class UserModel {
  constructor(private readonly prisma: PrismaService) {}

  public createUser(
    confirmationId: number,
    user: CreateUserDto,
  ): Promise<UserFields> {
    return this.prisma.user.create({
      select: userFields,
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        confirmationId,
      },
    });
  }

  public findConfirmation(email: string): Promise<Confirmation> {
    return this.prisma.confirmation.findUnique({ where: { email } });
  }

  public findProfile(id: number): Promise<UserFields> {
    return this.prisma.user.findUnique({
      select: userFields,
      where: { id },
    });
  }
  public findProfileByEmail(email: string): Promise<UserFields> {
    return this.prisma.user.findUnique({
      select: userFields,
      where: { email },
    });
  }

  public updateUser(id: number, name: string): Promise<UserFields> {
    return this.prisma.user.update({
      select: userFields,
      where: { id },
      data: { name },
    });
  }

  public findUserGames(id: number): Promise<UserGames[]> {
    return this.prisma.game.findMany({
      select: {
        id: true,
        maxTime: true,
        timeIncrement: true,
        sideSelecting: true,
        moves: true,
        isDraw: true,
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

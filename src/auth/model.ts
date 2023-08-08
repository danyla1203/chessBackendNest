import { Injectable } from '@nestjs/common';
import { Auth, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthModel {
  constructor(private readonly prisma: PrismaService) {}

  public async findUserByEmail(email: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  public async findConfirmation(email: string) {
    return this.prisma.confirmations.findUnique({ where: { email } });
  }
  public async changeConfirmationCode(id: number, code: number) {
    return this.prisma.confirmations.update({
      where: { id },
      data: { code: code + '' },
    });
  }
  public async confirmConfirmation(email: string) {
    return this.prisma.confirmations.update({
      where: { email },
      data: { isConfirmed: true },
    });
  }
  public createConfirmation(code: number, email: string) {
    return this.prisma.confirmations.create({
      data: {
        code: code + '',
        email,
      },
    });
  }

  public createSession(
    userId: number,
    refreshToken: string,
    deviceId: string,
  ): Promise<Auth> {
    return this.prisma.auth.create({
      data: {
        userId,
        deviceId,
        refreshToken,
      },
    });
  }
  public deleteSession(id: number): Promise<Auth> {
    return this.prisma.auth.delete({ where: { id } });
  }
  public findSession(refreshToken: string): Promise<Auth> {
    return this.prisma.auth.findFirst({ where: { refreshToken } });
  }
  public findSessionByUserId(id: number, deviceId: string) {
    return this.prisma.auth.findFirst({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        expiresIn: true,
        deviceId: true,
        refreshToken: true,
      },
      where: { userId: id, deviceId },
    });
  }
  public deleteSessionByUserId(id: number, deviceId: string) {
    return this.prisma.auth.deleteMany({ where: { userId: id, deviceId } });
  }
}

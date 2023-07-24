import { Injectable } from '@nestjs/common';
import { Auth, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthModel {
  constructor(private prisma: PrismaService) {}

  public async findByEmail(email: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { email } });
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
  public deleteSession(auth: Auth): Promise<Auth> {
    return this.prisma.auth.delete({ where: { id: auth.id } });
  }
  public findSession(refreshToken: string): Promise<Auth> {
    return this.prisma.auth.findFirst({ where: { refreshToken } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthModel {
  constructor(private prisma: PrismaService) {}

  public async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  public createSession(
    userId: number,
    refreshToken: string,
    deviceId: string,
  ): Promise<any> {
    return this.prisma.auth.create({
      data: {
        userId,
        deviceId,
        refreshToken,
      },
    });
  }
}

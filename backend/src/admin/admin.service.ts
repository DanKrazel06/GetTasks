import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { postedTasks: true, claimedTasks: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async impersonate(targetId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user };
  }
}

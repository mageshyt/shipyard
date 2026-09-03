import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SafeUser, SafeUserWithPassword } from './type/safe-user';

@Injectable()
export class UserService {
  constructor(private readonly db: PrismaService) { }

  findOne(userId: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
  }

  findByEmail(email: string): Promise<SafeUserWithPassword | null> {
    return this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        passwordHash: true,
      },
    });
  }

  create(user: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<SafeUser> {
    return this.db.user.create({
      data: user,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
  }
}

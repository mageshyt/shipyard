import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
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

  async create(user: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<SafeUser> {
    try {
      return await this.db.user.create({
        data: user,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    } catch (error) {
      // unique constraint (email) violated -> 409 with a specific message
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User with this email already exists');
      }
      throw error; // everything else keeps flowing to the global filter
    }
  }
}

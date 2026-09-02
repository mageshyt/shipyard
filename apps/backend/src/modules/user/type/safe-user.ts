import { User } from 'src/generated/prisma/client';

export type SafeUser = Omit<User, 'passwordHash' | 'updatedAt' | 'projects'>;
export type SafeUserWithPassword = Omit<User, 'updatedAt' | 'projects'>;

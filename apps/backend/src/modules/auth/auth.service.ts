import { Injectable } from '@nestjs/common';
import { UserService } from '@app/modules/user/user.service';
import * as argon from 'argon2';
import { SafeUser } from '../user/type/safe-user';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) { }

  async validateUser(email: string, pass: string): Promise<SafeUser | null> {
    const user = await this.userService.findByEmail(email);

    if (user && (await argon.verify(user.passwordHash, pass))) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }
}

import { Injectable } from '@nestjs/common';
import { UserService } from '@app/modules/user/user.service';
import * as argon from 'argon2';
import { SafeUser } from '../user/type/safe-user';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string): Promise<SafeUser | null> {
    const user = await this.userService.findByEmail(email);

    if (user && (await argon.verify(user.passwordHash, pass))) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: SafeUser): Promise<{ access_token: string }> {
    const paylaod = { username: user.email, sub: user.id };

    const access_token = await this.generateJwtToken(paylaod);

    return { access_token };
  }

  private async generateJwtToken(payload: {
    username: string;
    sub: string;
  }): Promise<string> {
    return this.jwtService.sign(payload);
  }
}

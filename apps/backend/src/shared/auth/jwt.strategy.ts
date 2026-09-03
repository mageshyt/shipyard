import { UserService } from '@app/modules/user/user.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy, ExtractJwt } from 'passport-jwt';
import { SafeUser } from '@app/modules/user/type/safe-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // ExtractJwt.fromAuthHeaderAsBearerToken() is a passport-jwt method that extracts the JWT from the request.
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: string; username: string }) {
    // Try to get user from cache first

    // const cachedUser = await this.jwtCacheService.getUser(
    //   payload.id,
    //   payload.role,
    // );
    // if (cachedUser) {
    //   console.log(cachedUser);
    //   console.log(`Cache hit for user: ${payload.role}:${payload.id}`);
    //   return cachedUser;
    // }

    // console.log(
    //   `Cache miss for user: ${payload.role}:${payload.id}, fetching from database`,
    // );

    let user: SafeUser | null = null;

    user = await this.userService.findOne(payload.sub);

    // Cache the user if found (cache for 5 minutes for JWT validation)
    // if (user) {
    //   await this.jwtCacheService.setUser(payload.id, payload.role, user);
    // }

    return user;
  }

  /**
   * Invalidate cached user data
   * Use this method when user data changes (profile updates, role changes, etc.)
   */
  async invalidateUserCache(userId: string, role: string): Promise<void> {
    // await this.jwtCacheService.invalidateUser(userId, role);
    // console.log(`Cache invalidated for user: ${role}:${userId}`);
  }

  /**
   * Invalidate all cached data for a user across all roles
   * Useful when a user is deleted or blocked
   */
  async invalidateAllUserCache(userId: string): Promise<void> {
    // await this.jwtCacheService.invalidateAllUserRoles(userId);
    // console.log(`All cache entries invalidated for user: ${userId}`);
  }
}

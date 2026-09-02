import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ROUTES } from '@app/core/constants';

@Controller(ROUTES.AUTH.CONTROLLER)
export class AuthController {
  @UseGuards(AuthGuard('local'))
  @Post(ROUTES.AUTH.LOGIN)
  async login(@Request() req) {
    return req.user;
  }
}

import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ROUTES } from '@app/core/constants';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, LocalAuthGuard } from '@app/shared/auth';

@Controller(ROUTES.AUTH.CONTROLLER)
@ApiTags(ROUTES.AUTH.TAGNAME)
export class AuthController {
  constructor(private authService: AuthService) { }
  @UseGuards(LocalAuthGuard)
  @Post(ROUTES.AUTH.LOGIN)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john@gmail.com' },
        password: { type: 'string', example: 'password' },
      },
    },
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req) {
    return req.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get(ROUTES.AUTH.ME)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user' })
  getProfile(@Request() req) {
    return req.user;
  }
}

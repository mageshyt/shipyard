import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ROUTES } from '@app/core/constants';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, LocalAuthGuard } from '@app/shared/auth';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller(ROUTES.AUTH.CONTROLLER)
@ApiTags(ROUTES.AUTH.TAGNAME)
export class AuthController {
  constructor(private authService: AuthService) { }
  @UseGuards(LocalAuthGuard)
  @Post(ROUTES.AUTH.LOGIN)
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post(ROUTES.AUTH.REGISTER)
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() user: CreateUserDto) {
    return this.authService.register(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(ROUTES.AUTH.LOGOUT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout() {
    // ponytail: no-op until token revocation (jwtCacheService) lands
  }

  @UseGuards(JwtAuthGuard)
  @Get(ROUTES.AUTH.ME)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user' })
  getProfile(@Request() req) {
    return req.user;
  }
}

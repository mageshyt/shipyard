import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { getLandingPageHtml } from './landing-page.html';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return getLandingPageHtml();
  }
}

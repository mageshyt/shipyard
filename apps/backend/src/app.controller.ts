import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { getLandingPageHtml } from './landing-page.html';
import { SkipStandardResponse } from './shared/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @SkipStandardResponse()
  getHello(): string {
    return getLandingPageHtml();
  }
}

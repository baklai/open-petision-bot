import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) {}

  @Post('bot*')
  statusTelegramBot(
    @Req() req: Record<string, any>,
    @Body() processUpdate: Record<string, any>
  ): any {
    const requestPath: string = req.url;
    const token = this.configService.get<string>('BOT_TOKEN');
    const webHook = this.configService.get<string>('WEB_HOOK');

    if (requestPath.includes(`bot${token}`) && webHook) {
      return this.appService.statusTelegramBot(processUpdate);
    } else {
      throw new BadRequestException('Invalid field value');
    }
  }
}

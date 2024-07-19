import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appService = app.get(AppService);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT');
  const host = configService.get<string>('HOST');
  const mode = configService.get<string>('NODE_ENV');
  const webHook = configService.get<string>('WEB_HOOK');

  if (webHook) {
    app.use(await appService.createWebhookTelegramBot());
  }

  await app.listen(port, host, async () => {
    console.info(`The application in ${mode} mode and run on: ${await app.getUrl()}/`);
  });
}
bootstrap();

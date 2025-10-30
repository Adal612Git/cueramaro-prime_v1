import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = app.get(ConfigService);

  const port = Number(process.env.PORT || config.get('PORT') || 3000);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      config.get<string>('CORS_ORIGIN') || ''
    ].filter(Boolean),
    credentials: true
  });

  await app.listen(port);
  // servir archivos de uploads de forma estática
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  // servir facturas generadas (xlsm/pdf) de forma estática
  const facturasDir = path.join(process.cwd(), 'facturas');
  app.useStaticAssets(facturasDir, { prefix: '/facturas' });
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}

bootstrap();

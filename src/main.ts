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

  // Security hardening (best-effort, optional dependencies)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const helmet = require('helmet');
    app.use(helmet());
  } catch {
    // eslint-disable-next-line no-console
    console.warn('helmet no instalado; omitiendo cabeceras de seguridad básicas');
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX || 300),
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use(limiter);
  } catch {
    // eslint-disable-next-line no-console
    console.warn('express-rate-limit no instalado; omitiendo limitación de peticiones');
  }

  const port = Number(process.env.PORT || config.get('PORT') || 3000);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      config.get<string>('CORS_ORIGIN') || ''
    ].filter(Boolean),
    credentials: true
  });

  // servir archivos estáticos ANTES de iniciar el servidor
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  const facturasDir = path.join(process.cwd(), 'facturas');
  app.useStaticAssets(facturasDir, { prefix: '/facturas' });

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}

bootstrap();

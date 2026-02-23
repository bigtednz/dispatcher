import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'] as const;
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('[Startup] Missing env:', missing.join(', '));
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.WEB_ORIGIN || 'http://localhost:3003', credentials: true });
  const port = process.env.PORT ?? 4000;
  const http = app.getHttpAdapter();
  const base = `http://localhost:${port}`;
  http.get('/', (_req: unknown, res: { setHeader: (k: string, v: string) => void; end: (s: string) => void }) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      message: 'Dispatcher API',
      api: `${base}/api`,
      health: `${base}/api/health`,
      web: process.env.WEB_ORIGIN || 'http://localhost:3003',
    }));
  });
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api`);
}

bootstrap().catch((err: unknown) => {
  console.error('[Startup] Fatal:', err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerFilter, LoggerService } from './tools/logger';

async function bootstrap() {
  const allowedOrigin =
    process.env.ENV === 'dev' ? 'http://localhost:8080' : '*';
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
    cors: {
      origin: allowedOrigin,
    },
  });
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new LoggerFilter(new LoggerService(), httpAdapter));
  await app.listen(process.env.PORT);
}
bootstrap();

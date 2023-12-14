import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT);
}
bootstrap();

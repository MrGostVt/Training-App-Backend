import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { DocumentBuilder } from '@nestjs/swagger';
import { setSwagger } from './config/swagger.config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {enableImplicitConversion: true},
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  setSwagger(app);

  app.enableCors({origin: ['http://localhost:9000']})

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//TODO: Test new auth & generation & e2e, в общем всё протестировать
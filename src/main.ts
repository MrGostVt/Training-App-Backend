import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { DocumentBuilder } from '@nestjs/swagger';
import { setSwagger } from './config/swagger.config';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {enableImplicitConversion: true},
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  setSwagger(app);
  const host = configService.getOrThrow('WEB_APP_HOST');

  app.enableCors({origin: [host], credentials: true});
  console.log(host);
  // app.useGlobalFilters({
  //   catch(exception, host) {
  //     console.error(exception);
  //     throw exception;
  //   }
  // });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//TODO: Test new auth & generation & e2e, в общем всё протестировать
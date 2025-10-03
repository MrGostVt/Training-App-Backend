import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthorizeModule } from './authorize/authorize.module';
import { ThemeModule } from './theme/theme.module';
import { QuestionModule } from './question/question.module';
import { GradeModule } from './grade/grade.module';
import { QuestionGeneratorModule } from './question-generator/question-generator.module';
import { RamDbModule } from './ram-db/ram-db.module';
import getTypeOrmConfig from './config/typeorm.config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true
  }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService]
  }),
    UserModule,
    AuthorizeModule,
    ThemeModule,
    QuestionModule,
    GradeModule,
    QuestionGeneratorModule,
    RamDbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

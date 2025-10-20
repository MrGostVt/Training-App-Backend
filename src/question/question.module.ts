import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './entity/question.entity';
import { UserModule } from 'src/user/user.module';
import { GradeModule } from 'src/grade/grade.module';
import { ThemeModule } from 'src/theme/theme.module';
import { QuestionGeneratorModule } from 'src/question-generator/question-generator.module';
import { RamDbModule } from 'src/ram-db/ram-db.module';

@Module({
  controllers: [QuestionController],
  providers: [QuestionService],
  imports: [TypeOrmModule.forFeature([QuestionEntity]), UserModule, GradeModule, ThemeModule, QuestionGeneratorModule, RamDbModule]
})
export class QuestionModule {}

import { Module } from '@nestjs/common';
import { QuestionGeneratorService } from './question-generator.service';
import { RamDbModule } from 'src/ram-db/ram-db.module';

@Module({
  providers: [QuestionGeneratorService],
  imports: [RamDbModule],
  exports: [QuestionGeneratorService],
})
export class QuestionGeneratorModule {}

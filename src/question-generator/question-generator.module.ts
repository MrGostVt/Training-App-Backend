import { Module } from '@nestjs/common';
import { QuestionGeneratorService } from './question-generator.service';
import { RamDbModule } from 'src/ram-db/ram-db.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatternsEntity } from './entity/patterns.entity';

@Module({
  providers: [QuestionGeneratorService],
  imports: [RamDbModule, TypeOrmModule.forFeature([PatternsEntity])],
  exports: [QuestionGeneratorService],
})
export class QuestionGeneratorModule {}

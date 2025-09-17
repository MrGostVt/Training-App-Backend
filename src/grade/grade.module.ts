import { Module } from '@nestjs/common';
import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeEntity } from './entity/grade.entity';

@Module({
  controllers: [GradeController],
  providers: [GradeService],
  imports: [TypeOrmModule.forFeature([GradeEntity])],
  exports: [GradeService],
})
export class GradeModule {}

import { Module } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { ThemeController } from './theme.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeEntity } from './entity/theme.entity';
import { GradeModule } from 'src/grade/grade.module';
import { IntegrationEntity } from './entity/integration.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [ThemeController],
  providers: [ThemeService],
  exports: [ThemeService],
  imports: [TypeOrmModule.forFeature([ThemeEntity, IntegrationEntity]), GradeModule, ConfigModule],
})
export class ThemeModule {}

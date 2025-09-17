import { Module } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { ThemeController } from './theme.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeEntity } from './entity/theme.entity';

@Module({
  controllers: [ThemeController],
  providers: [ThemeService],
  exports: [ThemeService],
  imports: [TypeOrmModule.forFeature([ThemeEntity])]
})
export class ThemeModule {}

import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { ThemeService } from 'src/theme/theme.service';
import { ThemeModule } from 'src/theme/theme.module';
import { GradeModule } from 'src/grade/grade.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [TypeOrmModule.forFeature([UserEntity]), ThemeModule, GradeModule],
  exports: [UserService],
})
export class UserModule {}

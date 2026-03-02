import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './entity/article.entity';

@Module({
  controllers: [ArticleController],
  imports: [TypeOrmModule.forFeature([ArticleEntity])],
  providers: [ArticleService],
})
export class ArticleModule {}

import { Body, Controller, FileTypeValidator, Get, HttpCode, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ArticleDto } from './dto/article.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/common/decorators/user.decorator';
import { Access } from 'src/common/decorators/access.decorator';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Auth()
  @Access(AccessLevel.Admin)
  @UseInterceptors(FileInterceptor('file'))
  @Post('create')
  @HttpCode(200)
  async create(@Body() data: ArticleDto, @UploadedFile((
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /\/(jpg|png|gif)$/,
            errorMessage: 'File must complain type'
          }),
          new MaxFileSizeValidator({
            maxSize: 1000 * 1000 * 8,
            errorMessage: 'File is too heavy'
          }),
        ], fileIsRequired: false
      })
    )) file: Express.Multer.File, @User('passport') passport: string){
    return await this.articleService.create(data, passport, file);
  }

  @Auth()
  @Access(AccessLevel.Default)
  @Get('get')
  async get(){
    return await this.articleService.get();
  }
}

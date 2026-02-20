import { Controller, FileTypeValidator, Get, HttpCode, MaxFileSizeValidator, ParseFilePipe, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';
import {Express} from 'express'
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterField } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import passport from 'passport';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Auth()
  @Get('get-data')
  @HttpCode(200)
  async getUserData(@User('passport') passport: string, @User('userName') username: string, @User('accessLevel') accessLevel: AccessLevel){
    return await this.userService.getUserData(passport, username, accessLevel);
  }

  @Auth()
  @Post('choose-theme')
  @HttpCode(200)
  async chooseCurrentTheme(@Query('theme') theme: string, @User('passport') passport: string, @User('accessLevel') accessLevel: AccessLevel){
    return await this.userService.chooseTheme(theme, passport, accessLevel);
  }

  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-icon')
  @HttpCode(200)
  async uploadIcon(@UploadedFile((
    new ParseFilePipe({
      validators: [
        new FileTypeValidator({
          fileType: /\/(jpg|png|gif)$/
        }),
        new MaxFileSizeValidator({
          maxSize: 1000 * 1000 * 3
        })
      ]
    })
  )) file: Express.Multer.File, @User('passport') passport: string){
    return await this.userService.uploadIcon(file, passport);
  }
}

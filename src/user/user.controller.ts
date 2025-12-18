import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';

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
  async chooseCurrentTheme(@Query('theme') theme: string, @User('passport') passport: string){
    return await this.userService.chooseTheme(theme, passport);
  }
}

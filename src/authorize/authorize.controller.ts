import { Body, Controller, Post, Headers, Get, Query } from '@nestjs/common';
import { AuthorizeService } from './authorize.service';
import { RegisterDTO } from './dto/register.dto';
import { AuthDataDTO } from './dto/authdata.dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('authorize')
export class AuthorizeController {
    constructor(private readonly authorizeService: AuthorizeService) {}
        
    @Post('/register')
    async register(@Body() userInfo: RegisterDTO, @Headers('user-agent') device: string){
        return this.authorizeService.createNewUser(userInfo, device);
    }
    
    @Post('/logIn')
    // @ApiBody({type: AuthDataDTO})
    async logIn(@Body() authInfo: AuthDataDTO, @Headers('user-agent') device: string){
        return this.authorizeService.authByPassword(authInfo, device);
    }

    @Get('check-username')
    async checkUsername(@Query('username') username: string){
      return await this.authorizeService.checkUsername(username);
    }
}

//05.12 нужно наверное добавить refresh token mechanism

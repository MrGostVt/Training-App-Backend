import { Body, Controller, Post, Headers } from '@nestjs/common';
import { AuthorizeService } from './authorize.service';
import { RegisterDTO } from './dto/register.dto';
import { AuthDataDTO } from './dto/authdata.dto';

@Controller('authorize')
export class AuthorizeController {
    constructor(private readonly authorizeService: AuthorizeService) {}
        
    @Post('/register')
    async register(@Body() userInfo: RegisterDTO, @Headers('user-agent') device: string){
        return this.authorizeService.createNewUser(userInfo, device);
    }
    
    @Post('/logIn')
    async logIn(@Body() authInfo: AuthDataDTO, @Headers('user-agent') device: string){
        return this.authorizeService.authByPassword(authInfo, device);
    }
}

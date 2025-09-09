import { Body, Controller, Post } from '@nestjs/common';
import { AuthorizeService } from './authorize.service';

@Controller('authorize')
export class AuthorizeController {
    constructor(private readonly authorizeService: AuthorizeService) {}
        
    @Post('/register')
    async register(@Body() userInfo: RegisterDTO){
        return this.authService.createNewUser(userInfo);
    }

    @Post('/logIn')
    async logIn(@Body() authInfo: AuthDataDTO){
        return this.authorizeService.authByPassword(authInfo);
    }
}

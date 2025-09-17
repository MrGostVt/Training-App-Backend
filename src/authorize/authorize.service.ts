import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthorizeEntity } from './entity/authorize.entity';
import { Repository } from 'typeorm';
import { RegisterDTO } from './dto/register.dto';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthDataDTO } from './dto/authdata.dto';
import { TokenData } from './type/tokenData.type';
import { ConfigService } from '@nestjs/config';

//TODO: Обновить сервис и сущность так, что бы можно было сохранять текущую занятость юзера (начал ли он прохождение теста или нет)
//      Возможно использовать редис.
@Injectable()
export class AuthorizeService {
    constructor(
        @InjectRepository(AuthorizeEntity) private readonly authRepository: Repository<AuthorizeEntity>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ){}
    
    async createNewUser(user: RegisterDTO, device): Promise<{token: string}>{
        const {userName, password} = user;

        const isExist: Boolean = !!(await this.authRepository.findOne({where: {userName}}));
        if(isExist) throw new ConflictException("User already exist");
        
        const hash = await this.register(password);

        const newUser: UserEntity = await this.userService.createUser();
        
        try{
            const userAuth: AuthorizeEntity = this.authRepository.create({
                userName,
                passport: newUser.id,
                hash,
            });
            await this.authRepository.save(userAuth);
            return await this.authByPassword({password, userName}, device);
        }
        catch{
            await this.userService.deleteUser(newUser.id);
            throw new ConflictException('Something went wrong');
        }
    }
    private async register(password: string){
        const salt = await this.getSalt();

        const hash = await bcrypt.hash(password, salt);

        return hash;
    }
    private async getSalt(){
        const saltRounds = 10;

        const salt = await bcrypt.genSalt(saltRounds);
        return salt;
    }

    private async verifyPassword(password: string, hash: string){
        const result: boolean = await bcrypt.compare(password, hash);

        return result;
    }

    async authByPassword(authData: AuthDataDTO, device: string): Promise<{token: string}>{
        const {password, userName} = authData;
        const user: AuthorizeEntity | null = await this.authRepository.findOne({where: {userName}});

        try{    
            const isRight = await this.verifyPassword(password, user!.hash)
            if(!isRight) throw 'Unauthorized';
        }
        catch{
            throw new UnauthorizedException("Unauthorized");
        }

        const jwt = await this.createJWT({id: user!.id, device}, this.configService.getOrThrow('JWT_EXPIRE'))

        return {token: jwt};
    }
    async authByTokenPayload(payload: TokenData, device: string): Promise<AuthorizeEntity>{
        let user: AuthorizeEntity | null;

        try{
            user = await this.authRepository.findOne({where: {id: payload?.id}});
            if(!user) throw "Not found exception";
            if(payload.device != device) {throw "Wrong device"}

        }
        catch{
            throw new UnauthorizedException("Unauthorized");
        }

        return user;
    }

    private async createJWT(tokenData: TokenData, expiresIn: string = '5m'): Promise<string>{
        const token = await this.jwtService.signAsync(tokenData, {expiresIn}) 
        return token;
    }

}

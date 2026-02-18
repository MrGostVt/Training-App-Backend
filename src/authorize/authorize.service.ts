import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';
import { access } from 'fs';

//TODO: Обновить сервис и сущность так, что бы можно было сохранять текущую занятость юзера (начал ли он прохождение теста или нет)
//      Возможно использовать редис.

//TODO: Подвязать уровень доступа к теме которую пользователь выбрал или врезать её в сервис работы с вопросами.
@Injectable()
export class AuthorizeService {
    constructor(
        @InjectRepository(AuthorizeEntity) private readonly authRepository: Repository<AuthorizeEntity>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ){}
    
    async createNewUser(user: RegisterDTO, device): Promise<{token: string}>{
        const {userName, password, isAdmin} = user;

        const isExist: Boolean = !!(await this.authRepository
            .createQueryBuilder('user')
            .where('user.userName ILIKE :userName', { userName })
            .getOne()
        );
        if(isExist) throw new ConflictException("User already exist");
        console.log("Existing check")

        const hash = await this.register(password);

        const newUser: UserEntity | null = await this.userService.createUser();

        if(!newUser){
            throw new BadRequestException('Something went wrong');
        }
        
        console.log("new user data check")

        try{
            const userAuth: AuthorizeEntity = this.authRepository.create({
                userName,
                passport: newUser.id,
                hash,
                isAdmin: !!isAdmin
            });
            await this.authRepository.save(userAuth);

            console.log('saving check')
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
        const user: AuthorizeEntity | null = await this.authRepository
            .createQueryBuilder('user')
            .where('user.userName ILIKE :userName', { userName })
            .getOne();

        if(user == null){
            throw new NotFoundException("User does not exist");
        }

        try{    
            const isRight = await this.verifyPassword(password, user!.hash);
            if(!isRight) throw 'Unauthorized';
        }
        catch{
            throw new UnauthorizedException("Unauthorized");
        }

        const jwt = await this.createJWT({id: user!.id, device}, this.configService.getOrThrow('JWT_EXPIRE'))

        return {token: jwt};
    }
    async authByTokenPayload(payload: TokenData, device: string): Promise<AuthorizeEntity & {accessLevel: AccessLevel}>{
        let user: (AuthorizeEntity & {accessLevel: AccessLevel}) | null;

        try{
            let userData = (await this.authRepository.findOne({where: {id: payload?.id}}));
            if(!userData) throw "Not found exception";
            if(payload.device != device) {throw "Wrong device"}

            const accessLevel =  userData.isAdmin? AccessLevel.Admin: await this.userService.checkUserAccessLevel(userData.passport);

            
            if(accessLevel === undefined){
                throw 'Wrong access level'
            }

            user = {
                ...userData, 
                accessLevel,
            }
        }
        catch(err){
            throw new UnauthorizedException(`Unauthorized: ${err}`);
        }

        return user;
    }

    private async createJWT(tokenData: TokenData, expiresIn: string = '5m'): Promise<string>{
        const token = await this.jwtService.signAsync(tokenData, {expiresIn}) 
        return token;
    }

    async checkUsername(userName: string): Promise<{isExist: Boolean}>{
        return {isExist: !!(await this.authRepository
            .createQueryBuilder('user')
            .where('user.userName ILIKE :userName', { userName })
            .getOne()
          )
        };
    }
}

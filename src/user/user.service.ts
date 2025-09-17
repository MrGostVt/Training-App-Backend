import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    ){}

    async findUser(passport: string): Promise<UserEntity | null>{
        
        const user = await this.userRepository.findOne({
            where: {id: passport}
        })

        return user
    }

    async setLastTimestamp(time: Date, passport: string){
        //Antifraud system, set last action to user by redis
    }

    async createUser(): Promise<UserEntity>{
        const user: UserEntity = this.userRepository.create({});

        await this.userRepository.save(user);

        return user;
    }
    async deleteUser(userId: string){
        const result = await this.userRepository.delete({id: userId});
        
        return result.affected !== 0;
    }
}

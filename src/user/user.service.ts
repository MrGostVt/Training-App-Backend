import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ThemeService } from 'src/theme/theme.service';
import { GradeService } from 'src/grade/grade.service';

//TODO:Сделать систему уровней, обновить поиск вопросов, допилить антифрод, тесты. 
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly themeService: ThemeService,
    ){}

    async findUser(passport: string): Promise<UserEntity | null>{
        
        const user = await this.userRepository.findOne({
            where: {id: passport},
            select: {
                grades: true,
                createdQuestions: true,
                moderatedQuestions: true,
            }
        })

        return user
    }

    async setLastTimestamp(time: Date, passport: string){
        //Antifraud system, set last action to user by redis
    }

    async createUser(): Promise<UserEntity | null>{

        const user: UserEntity = this.userRepository.create({});
        try{
            await this.userRepository.save(user);
            
            const result: boolean = await this.themeService.loadDefaultGrades(user.id);

            if(!result){
                throw 'Error';
            }

            return await this.findUser(user.id);
        }
        catch{
            return null;
        }
    }
    async deleteUser(userId: string){
        const result = await this.userRepository.delete({id: userId});
        
        return result.affected !== 0;
    }
}

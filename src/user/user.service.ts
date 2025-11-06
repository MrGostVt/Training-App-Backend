import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ThemeService } from 'src/theme/theme.service';
import { GradeService } from 'src/grade/grade.service';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';

//TODO:Сделать систему уровней, обновить поиск вопросов, допилить антифрод, тесты. 
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly themeService: ThemeService,
    ){}

    async findUser(passport: string): Promise<UserEntity | null>{
        console.log('Trying to find user')
        
        const user = await this.userRepository.findOne({
            where: {id: passport},
            select: {
                grades: true,
                createdQuestions: true,
                moderatedQuestions: true,
            }
        })
        console.log('Success')
        return user
    }

    async setLastTimestamp(time: Date, passport: string){
        //Antifraud system, set last action to user by redis
    }

    async createUser(): Promise<UserEntity | null>{
        console.log("Trying to create a user")
        const user: UserEntity = this.userRepository.create({});
        console.log("Success")
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

    async chooseTheme(themeId: string,passport: string ): Promise<boolean>{
        const theme = await this.themeService.find(themeId);
        const user = await this.findUser(passport);

        if(!theme || !user){
            return false;
        }
        
        user.chosenTheme = theme;

        const result = await this.userRepository.save(user);
        return true;
    }

    async checkUserAccessLevel(passport: string): Promise<AccessLevel | undefined>{
        const userData = await this.findUser(passport);
        let level = AccessLevel.Default;
        if(!userData || !userData.chosenTheme || !userData.chosenTheme.grade){
            return undefined;
        }

        const grade = userData?.grades.filter(grade => userData.chosenTheme?.id === grade.theme.id)[0];
        if(grade.grade >= userData.chosenTheme.maxPoints){
            level = AccessLevel.Creator;
            if(userData.createdQuestions.filter(quest => quest.author.id === passport).length > 10){
                level = AccessLevel.Moderator;
            }
        }

        return level;
    }

    async deleteUser(userId: string){
        const result = await this.userRepository.delete({id: userId});
        
        return result.affected !== 0;
    }
}

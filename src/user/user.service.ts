import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ThemeService } from 'src/theme/theme.service';
import { GradeService } from 'src/grade/grade.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly dataSource: DataSource,
        private readonly themeService: ThemeService,
        private readonly gradeService: GradeService,
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

    async createUser(): Promise<UserEntity | null>{
        const themes = await this.themeService.getAll();

        const userWithGrades = await this.dataSource.transaction(async (manager) => {
            const user: UserEntity = manager.create(UserEntity, {});
            await manager.save(user);

            const grades = await Promise.all(
                themes.map(theme => this.gradeService.create(user, theme))
            );

            manager.save(grades);

            return user;
        });

        return userWithGrades;
    }
    async deleteUser(userId: string){
        const result = await this.userRepository.delete({id: userId});
        
        return result.affected !== 0;
    }
}

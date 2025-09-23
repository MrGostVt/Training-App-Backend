import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GradeEntity } from './entity/grade.entity';
import { Repository } from 'typeorm';
import { ThemeEntity } from 'src/theme/entity/theme.entity';
import { UserEntity } from 'src/user/entity/user.entity';

@Injectable()
export class GradeService {
    constructor(
        @InjectRepository(GradeEntity) private readonly gradeRepository: Repository<GradeEntity>,
    ){}

    async addPoints(points: number, themeId: string, passport: string): Promise<Boolean>{
        const grade: GradeEntity | null = await this.gradeRepository.findOne({where: {theme: {id: themeId}, user: {id: passport}}});
        if(!grade){
            return false
        }

        grade.grade = grade.grade + points;

        this.gradeRepository.save(grade);

        return true;
    }

    async create(user: UserEntity, theme: ThemeEntity){
        const grade: GradeEntity = this.gradeRepository.create({
            grade: 0,
            theme: theme,
            user: user,
        })

        return grade;
    }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GradeEntity } from './entity/grade.entity';
import { Repository } from 'typeorm';

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
}

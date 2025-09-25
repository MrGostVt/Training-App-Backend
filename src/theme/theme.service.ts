import { BadRequestException, Injectable } from '@nestjs/common';
import { ThemeEntity } from './entity/theme.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ThemeDTO } from './dto/theme.dto';
import { UserEntity } from 'src/user/entity/user.entity';
import { GradeService } from 'src/grade/grade.service';


@Injectable()
export class ThemeService {
    constructor(@InjectRepository(ThemeEntity) private readonly themeRepository: Repository<ThemeEntity>,
        private readonly dataSource: DataSource,
        private readonly gradeService: GradeService,
    ){}

    async find(themeId: string): Promise<ThemeEntity | null>{
        const theme = await this.themeRepository.findOne({where: {id: themeId}});
        
        return theme;
    } 

    async create(theme: ThemeDTO){
        const {title} = theme;

        const entity = this.themeRepository.create({
            title,
        });

        try{
            await this.themeRepository.save(entity);
        }
        catch(err){
            throw new BadRequestException('Something went wrong');
        }

        return;
    }

    async get(passport: string){
        const themes = await this.themeRepository.find({select: {id: true}});
        let userThemes = await this.themeRepository.find({where: {grade: {user: {id: passport}}}});

        if(themes.length > userThemes.length){
            const missing = themes.filter((val) => {return !userThemes.find((userVal) => val.id === userVal.id)});
            await this.loadGrades(passport, missing);
            
            userThemes = await this.themeRepository.find({where: {grade: {user: {id: passport}}}});
        }

        return userThemes;
    }

    async getGrade( theme: string, passport: string): Promise<number | undefined>{
        const grade: number | undefined = (await this.themeRepository.findOne({where: {id: theme, grade: {user: {id: passport}}}, select: {grade: {grade: true}}}))?.grade.grade

        return grade;    
    }

    async getGradeSection(theme: string, passport: string): Promise<number | null>{
        const themeData = await this.find(theme);
        const grade: number | undefined = await this.getGrade(theme, passport);

        if(!themeData || !grade){
            return null;
        }

        
        const gradeSection = [themeData.maxPoints * 0.2, themeData.maxPoints * 0.5, themeData.maxPoints * 0.84];

        const section: number = gradeSection.findIndex((val, index, obj) => (obj[index-1] | 0) < grade && grade < val);

        return section === -1? gradeSection.length-1: section;
    }

    async loadDefaultGrades(passport: string): Promise<boolean>{
        const themes: ThemeEntity[] = await this.themeRepository.find({select: {id: true}});
        
        return await this.dataSource.transaction(async (manager) => {
            try{
                const grades = await Promise.all(
                    themes.map(theme => this.gradeService.create(passport, theme))
                );
                manager.save(grades);
            }
            catch{
                return false
            }

            return true;
        });

    }
    async loadGrades(passport: string, themes: ThemeEntity[]){
        return await this.dataSource.transaction(async (manager) => {
            try{
                const grades = await Promise.all(
                    themes.map(theme => this.gradeService.create(passport, theme))
                );
                manager.save(grades);
            }
            catch{
                return false
            }

            return true;
        });
    }

    async getAll(){
        return await this.themeRepository.find();
    }
}

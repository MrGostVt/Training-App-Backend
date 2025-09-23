import { BadRequestException, Injectable } from '@nestjs/common';
import { ThemeEntity } from './entity/theme.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemeDTO } from './dto/theme.dto';


@Injectable()
export class ThemeService {
    constructor(@InjectRepository(ThemeEntity) private readonly themeRepository: Repository<ThemeEntity>
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
        const themes = await this.themeRepository.find({where: {grade: {user: {id: passport}}}});

        return themes;
    }

    async getAll(){
        return await this.themeRepository.find();
    }
}

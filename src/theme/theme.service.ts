import { Injectable } from '@nestjs/common';
import { ThemeEntity } from './entity/theme.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class ThemeService {
    constructor(@InjectRepository(ThemeEntity) private readonly themeRepository: Repository<ThemeEntity>
    ){}

    async find(themeId: string): Promise<ThemeEntity | null>{
        const theme = await this.themeRepository.findOne({where: {id: themeId}});
        
        return null;
    } 
}

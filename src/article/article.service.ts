import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from './entity/article.entity';
import { ArticleDto } from './dto/article.dto';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { UUID } from 'crypto';
import { debug } from 'console';

type Article = {
    title: string,
    header: string,
    description: string,
    image: string | null,
    background: string,
}


@Injectable()
export class ArticleService {
    private readonly limit = 10;
    constructor(
        @InjectRepository(ArticleEntity) private readonly repository: Repository<ArticleEntity>
    ){}

    async saveImage(file: Express.Multer.File): Promise<string> {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'article');
        const type = file.mimetype.split('/')[1];
        const filename = `image-${+new Date()}.${type}`;
        file.filename = filename;
        const filePath = path.join(uploadDir, file.filename);

        if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive: true});
        fs.writeFileSync(filePath, file.buffer);
        
        return filename;
    }
    async deleteImage(image: string){
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'article');
        if(!fs.existsSync(uploadDir)) return;
        const checkDir = uploadDir + '/' + image
        if(fs.existsSync(checkDir)) fs.rmSync(checkDir);
        return;
    }

    async delete(article: ArticleEntity){
        if(!article.image) return;
        await this.deleteImage(article.image);

        await this.repository.delete({id: article.id});
    }
    async create(data: ArticleDto, passport: string, file?: Express.Multer.File){
        const {header, title, description, background} = data;
        let created;
        try{
            let image: string | null = null;
            if(file) image = await this.saveImage(file);
    
            const article = this.repository.create({
                header, title, description, background, image, author: {id: passport}
            });
            await this.repository.save(article);
            created = article;
    
            const count = await this.repository.count();
            if(count > this.limit){
                const oldest = await this.repository.findOne({
                    order: {createdAt: 'ASC'},
                    where: {}
                });
                if(oldest !== null) this.delete(oldest);
            }
            
            return true;
        }
        catch(err){
            console.error(err);
            if(created !== undefined) this.delete(created);
            throw new BadRequestException('Something went wrong!');
        }
    }

    async get(): Promise<{news: Article[]}>{
        const articles = await this.repository.find({order: {createdAt: 'DESC'}});
        const news: Article[] = articles.map(article => {
            return{
                title: article.title,
                header: article.header,
                description: article.description,
                background: article.background,
                image: article.image === null? null: `uploads/article/${article.image}`
            }});
        return {news};
    }
}

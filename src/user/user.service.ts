import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ThemeService } from 'src/theme/theme.service';
import { GradeService } from 'src/grade/grade.service';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';
import { use } from 'passport';
import { ModerationState } from 'src/common/enums/ModerationState.enum';

type UserData = {
    username: string,
    accessLevel: AccessLevel,
    chosenTheme: {
        id: string,
        title: string,
    },
    currentGrade: number | null,
    createdQuestions: number | null,
    publishedQuestions: number | null,
    discardedQuestions: number | null,
    moderatedQuestionsCount: number | null,
    publishedQuestionsCount: number | null,
    skippedQuestionsCount: number | null,
}

type QueryParams = {
    select?: any[], 
    where?: any[], 
    leftJoin?: {table?: string, field: string, alias?: string}[], 
    addSelect?: {select: any, name: any}[], 
    groupBy?: string, 
    addGroupBy?: any[],
    setParameter?: {key: string, value: any}[],
    // addLeftJoin?: [],
}

type UpdatedThemeData = {
    accessLevel: AccessLevel,
    currentGrade: number | null,
    createdQuestions: number | null,
    publishedQuestions: number | null,
    discardedQuestions: number | null,
    moderatedQuestionsCount: number | null,
    publishedQuestionsCount: number | null,
    skippedQuestionsCount: number | null,
}

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
                createdQuestions: true,
                moderatedQuestions: true,
                chosenTheme: true,
            },
            relations: ['chosenTheme'],
        })

        if(!!user && !user.createdQuestions){
            user.createdQuestions = [];
        }
        if(!!user && !user.moderatedQuestions){
            user.moderatedQuestions = [];
        }

        return user;
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
    async chooseTheme(themeId: string, passport: string, accessLevel: AccessLevel): Promise<UpdatedThemeData | null>{
        const query = await this.generateQuery(
            {
                leftJoin: [
                    { field: 'chosenTheme', alias: 'chosentheme' },
                    { field: 'grades', alias: 'grade' },
                  
                    { field: 'createdQuestions', alias: 'createdquestions' },
                    { field: 'moderatedQuestions', alias: 'moderatedquestions' },
                  
                    { table: 'grade', field: 'theme', alias: 'gradetheme' },
                    { table: 'createdquestions', field: 'theme', alias: 'createdtheme' },
                    { table: 'moderatedquestions', field: 'theme', alias: 'moderatedtheme' },
                ],
                where: [{id: passport}],
                select: [
                    'chosentheme.id AS theme',
                    'chosentheme.title AS themetitle',
                ],
                addSelect: [
                    {select: 'MAX(grade.grade) FILTER (WHERE gradetheme.id = chosentheme.id)', name: 'grade'},
                    {select: 'COUNT(DISTINCT createdquestions.id) FILTER (WHERE createdtheme.id = chosentheme.id)', name: 'createdCount'},
                    {select: `COUNT(DISTINCT createdquestions.id) FILTER (WHERE createdquestions.moderation_status = :published AND createdtheme.id = chosentheme.id)`, name: 'publishedCount'},
                    {select: `COUNT(DISTINCT createdquestions.id) FILTER (WHERE createdquestions.moderation_status = :skipped AND createdtheme.id = chosentheme.id)`, name: 'discardedCount'},
                    {select: 'COUNT(DISTINCT moderatedquestions.id) FILTER (WHERE moderatedtheme.id = chosentheme.id)', name: 'moderatedCount'},
                    {select: `COUNT(DISTINCT moderatedquestions.id) FILTER (WHERE moderatedquestions.moderation_status = :published AND moderatedtheme.id = chosentheme.id)`, name: 'publishedCountBy'},
                    {select: `COUNT(DISTINCT moderatedquestions.id) FILTER (WHERE moderatedquestions.moderation_status = :skipped AND moderatedtheme.id = chosentheme.id)`, name: 'skippedCount'},
                ],
                setParameter: [{key: 'published', value: ModerationState.Published}, {key: 'skipped', value: ModerationState.Skipped}, {key: 'onmoderation', value: ModerationState.onModeration}
                ],
                groupBy: 'chosentheme.id',
                addGroupBy: ['grade.id', 'gradetheme.id'],
                
            });
        const user = await this.findUser(passport);
        const theme = await this.themeService.find(themeId);

        const isAdmin = accessLevel === AccessLevel.Admin;
        if(!user) throw new UnauthorizedException('User not found');
        await this.userRepository.update({id: passport}, {chosenTheme: theme});
        if(theme) var {createdCount, publishedCount, discardedCount, publishedCountBy, skippedCount, moderatedCount, grade} = await query.getRawOne();
        
        const data: UpdatedThemeData = {
            createdQuestions: createdCount || 0,
            publishedQuestions:publishedCount || 0,
            discardedQuestions: discardedCount || 0,
            publishedQuestionsCount: publishedCountBy || 0,
            skippedQuestionsCount: skippedCount || 0,
            moderatedQuestionsCount: moderatedCount || 0,
            accessLevel: isAdmin? AccessLevel.Admin: await this.checkUserAccessLevel(passport) || AccessLevel.Default,
            currentGrade: grade || 0,
        }
        return data;
    }

    async checkUserAccessLevel(passport: string): Promise<AccessLevel | undefined>{
        const userData = await this.findUser(passport);
        let level = AccessLevel.Default;
        if(!userData || !userData.chosenTheme){
            return level;
        }
        
        const grade = await this.themeService.getGrade(userData.chosenTheme.id, passport);
        if(!!grade && grade >= userData.chosenTheme.maxPoints){
            level = AccessLevel.Creator;
            if(userData.createdQuestions.filter(quest => quest.author.id === passport && quest.moderationStatus === ModerationState.Published).length > 10){
                level = AccessLevel.Moderator;
            }
        }

        return level;
    }

    async deleteUser(userId: string){
        const result = await this.userRepository.delete({id: userId});
        
        return result.affected !== 0;
    }

    async generateQuery({select= [], where= [], leftJoin= [], addSelect= [], groupBy='', addGroupBy= [], setParameter=[]}: QueryParams){
        const defaultTable = 'user';
        const user = this.userRepository.createQueryBuilder('user');
        for(let block of leftJoin){
            user.leftJoin(`${block.table || defaultTable}.${block.field}`, block.alias || block.field);
        }
        for(let here of where){ //{key: value}
            const key = Object.keys(here)[0];
            user.where(`user.${key} = :${key}`, here);
        }
        user.select(select);
        for(let data of addSelect){ //{select, name}
            user.addSelect(data.select, data.name)
        }
        user.groupBy(groupBy);
        for(let name of addGroupBy){
            user.addGroupBy(name);
        }
        for(let param of setParameter){ 
            user.setParameter(param.key, param.value);
        }
        return user;
    }

    async getUserData(userId: string, username: string, accessLevel: AccessLevel){
        const query = await this.generateQuery(
            {
                leftJoin: [
                    { field: 'chosenTheme', alias: 'chosentheme' },
                    { field: 'grades', alias: 'grade' },
                  
                    { field: 'createdQuestions', alias: 'createdquestions' },
                    { field: 'moderatedQuestions', alias: 'moderatedquestions' },
                  
                    { table: 'grade', field: 'theme', alias: 'gradetheme' },
                    { table: 'createdquestions', field: 'theme', alias: 'createdtheme' },
                    { table: 'moderatedquestions', field: 'theme', alias: 'moderatedtheme' },
                ],
                where: [{id: userId}],
                select: [
                    'chosentheme.id AS theme',
                    'chosentheme.title AS themetitle',
                ],
                addSelect: [
                    {select: 'MAX(grade.grade) FILTER (WHERE gradetheme.id = chosentheme.id)', name: 'grade'},
                    {select: 'COUNT(DISTINCT createdquestions.id) FILTER (WHERE createdtheme.id = chosentheme.id)', name: 'createdCount'},
                    {select: `COUNT(DISTINCT createdquestions.id) FILTER (WHERE createdquestions.moderation_status = :published AND createdtheme.id = chosentheme.id)`, name: 'publishedCount'},
                    {select: `COUNT(DISTINCT createdquestions.id) FILTER (WHERE createdquestions.moderation_status = :skipped AND createdtheme.id = chosentheme.id)`, name: 'discardedCount'},
                    {select: 'COUNT(DISTINCT moderatedquestions.id) FILTER (WHERE moderatedtheme.id = chosentheme.id)', name: 'moderatedCount'},
                    {select: `COUNT(DISTINCT moderatedquestions.id) FILTER (WHERE moderatedquestions.moderation_status = :published AND moderatedtheme.id = chosentheme.id)`, name: 'publishedCountBy'},
                    {select: `COUNT(DISTINCT moderatedquestions.id) FILTER (WHERE moderatedquestions.moderation_status = :skipped AND moderatedtheme.id = chosentheme.id)`, name: 'skippedCount'},
                ],
                setParameter: [{key: 'published', value: ModerationState.Published}, {key: 'skipped', value: ModerationState.Skipped}, {key: 'onmoderation', value: ModerationState.onModeration}
                ],
                groupBy: 'chosentheme.id',
                addGroupBy: ['grade.id', 'gradetheme.id'],
                
            });
        const user = await query.getRawOne();

        if(!user){
            throw new BadRequestException('User is not exist');
        }

        const {
            theme, themetitle, createdCount, moderatedCount,
            discardedCount, publishedCount, publishedCountBy, skippedCount, grade,
        } = user;

        const formedData: UserData = {
            username,
            accessLevel,
            chosenTheme: {
                id: '',
                title: '',
            },
            currentGrade: grade || 0,
            createdQuestions: parseInt(createdCount) || 0,
            publishedQuestions: parseInt(publishedCount) || 0,
            discardedQuestions: parseInt(discardedCount) || 0,
            moderatedQuestionsCount: parseInt(moderatedCount) || 0,
            publishedQuestionsCount: parseInt(publishedCountBy) || 0,
            skippedQuestionsCount: parseInt(skippedCount) || 0,
        };

        if(!user.theme){
            return formedData;
        }

        formedData.chosenTheme.id = theme;
        formedData.chosenTheme.title = themetitle;

        return formedData;
    }
}

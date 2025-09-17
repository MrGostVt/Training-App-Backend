import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QuestionEntity } from './entity/question.entity';
import { QuestionDTO } from './dto/question.dto';
import { UserService } from 'src/user/user.service';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';
import { ThemeService } from 'src/theme/theme.service';
import { QuestionLevel } from 'src/common/enums/QuestionLevel.enum';
import { QuestionType } from 'src/common/enums/QuestionType.enum';
import { AnswerDTO } from './dto/answer.dto';
import { GradeService } from 'src/grade/grade.service';
import { ModerationResult } from './dto/moderation-result.dto';

@Injectable()
export class QuestionService {
    constructor(
        @InjectRepository(QuestionEntity) private readonly questionRepository: Repository<QuestionEntity>,
        private readonly userService: UserService,
        private readonly themeService: ThemeService,
        private readonly gradeService: GradeService,
    ){}

    async find(id: string): Promise<QuestionEntity | null>{
        const question = await this.questionRepository.findOne({where: {
            id
        }});

        return question;
    }

    async create(question: QuestionDTO, userPassport: string, userLevel: AccessLevel){
        const {title, answers, rightAnswers, level, maxPoints, type, theme} = question;

        const author = await this.userService.findUser(userPassport);
        const themeEntity = await this.themeService.find(theme);

        if(!author){
            throw new UnauthorizedException('User not found');
        }
        if(!themeEntity){
            throw new BadRequestException('Theme not found');
        }
        
        try{
            const questionEntity = await this.questionRepository.create({
                title,
                answers,
                rightAnswers,
                level,
                maxPoints,
                type,
                theme: themeEntity,
                author,
                isModerated: userLevel === AccessLevel.Admin,
            });

            await this.questionRepository.save(questionEntity);

            return true;
        }
        catch(err){
            throw new BadRequestException("Something went wrong");
        }
    }
    generateModeratingQuestionQuery(theme: string, ): SelectQueryBuilder<QuestionEntity>{
        const query = this.questionRepository.createQueryBuilder('q')
            .where('q.themeId = :themeId', { themeId: theme })
            .andWhere('q.isModerated = :isModerated', {isModerated: false})
            .andWhere('q.last_moderator_passport = :val', {val: null})
            .select([
                'q.id',
                'q.answers',
                'q.rightAnswers',
                'q.title',
                'q.level',
                'q.max_points',
                'q.type',
                'q.last_moderator_passport',
            ]);

        return query;
    }


    generateQuestionQuery(theme: string, limit: number, params: [{key: string, value: any}]): SelectQueryBuilder<QuestionEntity>{
        const query = this.questionRepository.createQueryBuilder('q')
            .where('q.themeId = :themeId', { themeId: theme })
            .andWhere('q.isModerated = :isModerated', {isModerated: true})
        for (const param of params) {
            query.andWhere(`q.${param.key} = :${param.key}`, {[param.key]: param.value})
        }

        query.orderBy('RANDOM()')
            .limit(limit)
            .select([
                'q.id',
                'q.tittle',
                'q.level',
                'q.max_points',
                'q.type',
                'q.answers',
                'q.right_answers',
            ])

        return query;
    }

    async get(theme: string, passport: string){
        ['default', 'hard', 'othertype']
        
        const easy = await (this.generateQuestionQuery(theme, 3,[{key: 'level',value: QuestionLevel.easy}])).getMany()
        const middle = await (this.generateQuestionQuery(theme, 3, [{key: 'level',value: QuestionLevel.middle}])).getMany()
        const hard = await (this.generateQuestionQuery(theme,1, [{key: 'level',value: QuestionLevel.hard}])).getMany()
        const order = await (this.generateQuestionQuery(theme,2, [{key: 'type',value: QuestionType.order}])).getMany()
    
        const list = [...easy, ...middle, ...hard, ...order];

        return list;
    }

    private checkAnswerWithOrder(answers: number[], correctAnswers: number[], maxPoints: number): number{
        if(answers.length === correctAnswers.length){
            for(let i = 0; i < correctAnswers.length; i++){
                if(answers[i] !== correctAnswers[i]){
                    return 0;
                }
            }
        }
        else{
            return 0;
        }
        return maxPoints;
    }

    private checkAnswerDefault(answers: number[], correctAnswers: number[], maxPoints: number): number{
        let correct = 0;
        
        for(const correctId of correctAnswers){
            if(answers.includes(correctId)){
                correct++;
            }
        }
        const points = Math.floor(correct/correctAnswers.length * maxPoints);        
        return points;
    }

    private checkAnswers(type: QuestionType, answers: number[], correctAnswers: number[], maxPoints: number){
        switch(type){
            case QuestionType.order: return this.checkAnswerWithOrder(answers, correctAnswers, maxPoints);
            default: return this.checkAnswerDefault(answers, correctAnswers, maxPoints);
        }
    }

    async answer(answers: AnswerDTO, passport: string){
        const question: QuestionEntity | null = await this.find(answers.questionID);

        if(!question){
            throw new BadRequestException('Wrong question');
        }
        
        const points = this.checkAnswers(question.type, answers.rightAnswers, question.rightAnswers, question.maxPoints);
        if(await this.gradeService.addPoints(points, question.theme.id, passport)){
            return {points}
        }
        
        throw new BadRequestException("Something went wrong");
    }

    async getModerating(theme: string, passport: string){
        const query = this.generateModeratingQuestionQuery(theme);
        const question = await query.getOne();

        if(!question){
            throw new BadRequestException('No questions on moderating');
        }

        await this.questionRepository.update({id: question.id}, {lastModeratorPassport: passport});

        //TODO: либо сделать свой сервис который будет сохранять состояние таймера с возможностью отключения при выполненом условии, либо установить либу для отложенных действий

        setTimeout(async () => {
            const moderationResult = (await (this.questionRepository.findOne({where: {id: question.id}, select: {isModerated: true}})))?.isModerated;
            if(!moderationResult){
                await this.questionRepository.update({id: question.id}, {lastModeratorPassport: null});
            }

        }, 60 * 7 * 1000);

        return {question}
    }

    async moderate(result: ModerationResult, passport: string){
        const {questionID, themeID, timestamp, approved } = result;
        const questionModeration = (await (this.questionRepository.findOne({where: {id: questionID, theme: {id: themeID}}, select: {lastModeratorPassport: true}})));

        if(!questionModeration){
            throw new BadRequestException('Question not exists');
        }
        if(questionModeration.lastModeratorPassport !== passport){
            throw new ForbiddenException('Access denied');
        }

        if(approved){
            await this.questionRepository.update({id: questionID}, {isModerated: true});
        }
        else{
            await this.questionRepository.delete({id: questionID});
        }


        //TODO: add a cooldown for moderating based on level/moderated count;
        return;
    }
}

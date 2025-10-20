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
import { DefaultQuestion, GenericQuestionData, QuestionData } from 'src/common/types/Question.type';
import { QuestionGeneratorService } from 'src/question-generator/question-generator.service';
import { RamDbService } from 'src/ram-db/ram-db.service';
import { GenerationPatternDTO } from '../common/dto/generation-pattern.dto';

@Injectable()
export class QuestionService {
    private readonly questionRelation = [
        {easy: 0.5, middle: 0.2, hard: 0.1, order: 0.2}, 
        {easy: 0.2, middle: 0.4, hard: 0.2, order: 0.2},
        {easy: 0, middle: 0.2, hard: 0.5, order: 0.3}
    ];
    private readonly questionCount = 10;
    constructor(
        @InjectRepository(QuestionEntity) private readonly questionRepository: Repository<QuestionEntity>,
        private readonly userService: UserService,
        private readonly themeService: ThemeService,
        private readonly gradeService: GradeService,
        private readonly generator: QuestionGeneratorService,
        private readonly ramDb: RamDbService
    ){}

    async find(id: string): Promise<QuestionEntity | null>{
        const question = await this.questionRepository.findOne({where: {
            id
        }});

        return question;
    }

    async create(question: QuestionDTO, userPassport: string, userLevel: AccessLevel){
        const {title, answers, rightAnswers, level, type, theme} = question;

        const author = await this.userService.findUser(userPassport);
        const themeEntity = await this.themeService.find(theme);

        if(!author){
            throw new UnauthorizedException('User not found');
        }
        if(!themeEntity){
            throw new BadRequestException('Theme not found');
        }

        let maxPoints: number;

        switch(level){
            case QuestionLevel.easy: maxPoints = 3; break;
            case QuestionLevel.middle: maxPoints = 5; break;
            case QuestionLevel.hard: maxPoints = 7; break;
            default: maxPoints = 3; break;
        }

        switch(type){
            case QuestionType.default: maxPoints += 1; break;
            case QuestionType.order: maxPoints += 2; break;
            case QuestionType.input: maxPoints += 3; break; 
            default: maxPoints += 1; break;
        }
        
        try{
            const questionEntity = this.questionRepository.create({
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

    //Возможно даже добавить отнимающие баллы
    //Добавить авто генерацию вопросов. Для этого описать паттерны генерации в бд. Доступ только для админов
    // 
    
    async get(theme: string, passport: string): Promise<{list: DefaultQuestion[]}>{
        ['default', 'hard', 'othertype']
        const section: number | null = await this.themeService.getGradeSection(theme, passport);

        if((section !== 0 && !section)){
            throw new BadRequestException('Something went wrong');
        }

        const easy = await (this.generateQuestionQuery(theme, this.questionRelation[section].easy,[{key: 'level',value: QuestionLevel.easy}])).getMany() as DefaultQuestion[]
        const middle = await (this.generateQuestionQuery(theme, this.questionRelation[section].middle, [{key: 'level',value: QuestionLevel.middle}])).getMany() as DefaultQuestion[]
        const hard = await (this.generateQuestionQuery(theme, this.questionRelation[section].hard, [{key: 'level',value: QuestionLevel.hard}])).getMany() as DefaultQuestion[]
        const order = await (this.generateQuestionQuery(theme, this.questionRelation[section].order, [{key: 'type',value: QuestionType.order}])).getMany() as DefaultQuestion[]
    
        const list = [...easy, ...middle, ...hard, ...order];

        return {list};
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
        const genericTest = answers.questionID.split(':');
        let question: QuestionData | null;
        if(genericTest[0] === 'generic'){
            question = await this.generator.checkAnswers(answers.questionID);
        }
        else{
            question = await this.find(answers.questionID);
        }


        if(!question){
            throw new BadRequestException('Wrong question');
        }
        
        const points = this.checkAnswers(question.type, answers.rightAnswers, question.rightAnswers, question.maxPoints);
        if(await this.gradeService.addPoints(points, question.theme.id, passport)){
            if(question.id.split(':')[0] === 'generic'){
                this.generator.deleteQuestion(question.id);
            }
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
        
        this.ramDb.addEntry(`${question.id}:${passport}`, {}, {
            func: async () => {
                const moderationResult = (await (this.questionRepository.findOne({where: {id: question.id}, select: {isModerated: true}})))?.isModerated;
                if(!moderationResult){
                    await this.questionRepository.update({id: question.id}, {lastModeratorPassport: null});
                }
            },
            time: this.ramDb.formatTime('7m')! //
            }
        );

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

    
    async createGenerationPattern(patternDto: GenerationPatternDTO, passport: string){
        const {themeId} = patternDto;
        
        try{
            const isThemeExist = !!(await this.themeService.isExist(themeId))

            if(!isThemeExist) throw {message: 'Bad request'}

            const isCreated = await this.generator.createPattern(patternDto);

            if(!isCreated) throw {message: 'Bad request'}
        }   
        catch(err){
            throw new BadRequestException('Something went wrong')
        }

        return; 
        //TODO: PAttern validation(chat gpt), pattern checking - generator, try catch scheme in pattern reader, testing.
    }
}

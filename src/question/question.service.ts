import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, SelectQueryBuilder } from 'typeorm';
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
import { ModerationState } from 'src/common/enums/ModerationState.enum';
import { time } from 'console';

@Injectable()
export class QuestionService {
    private readonly questionRelation = [
        {easy: 0.5, middle: 0.2, hard: 0.1, generated: 0.2}, 
        {easy: 0.2, middle: 0.4, hard: 0.2, generated: 0.2},
        {easy: 0, middle: 0.2, hard: 0.5, generated: 0.3}
    ];
    private readonly maxQuestionsCount = 15;
    constructor(
        @InjectRepository(QuestionEntity) private readonly questionRepository: Repository<QuestionEntity>,
        private readonly userService: UserService,
        private readonly themeService: ThemeService,
        private readonly gradeService: GradeService,
        private readonly generator: QuestionGeneratorService,
        private readonly ramDb: RamDbService
    ){
        this.reInitializeQuestionsOnModeration();
    }
    async reInitializeQuestionsOnModeration(){
        const questions = await this.questionRepository.find({where: {lastModeratorPassport: Not(IsNull()), moderationStatus: ModerationState.onModeration}, 
            select: {lastModeratorPassport: true, id: true}});
        
        console.log("Reinitialize " + questions.length + " questions")
        for(let question of questions){
            this.writeOnModerationEntry(question, question.lastModeratorPassport!);
        }
    }
    async find(id: string): Promise<QuestionEntity | null>{
        const question = await this.questionRepository.findOne({where: {
                id
            }, 
            select: {theme: {id: true}},
            relations: ['theme']
        });

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
            // console.log('theme', theme);
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
                moderationStatus: userLevel === AccessLevel.Admin? ModerationState.Published: ModerationState.onModeration,
            });
            // console.log('Tut popitka save')
            await this.questionRepository.save(questionEntity);

            return true;
        }
        catch(err){
            console.log(err);
            throw new BadRequestException("Something went wrong");
        }
    }

    generateQuestionQuery(theme: string, limit: number, params: [{key: string, value: any}]): SelectQueryBuilder<QuestionEntity>{
        const query = this.questionRepository.createQueryBuilder('q')
            .where('q.themeId = :themeId', { themeId: theme })
            .andWhere('q.moderation_status = :moderation', {moderation: ModerationState.Published})
        for (const param of params) {
            query.andWhere(`q.${param.key} = :${param.key}`, {[param.key]: param.value})
        }
        console.log(`LIMIT: ${limit}`)

        query.orderBy('RANDOM()')
            .limit(limit)
            .select([
                'q.id',
                'q.title',
                'q.level',
                'q.maxPoints',
                'q.type',
                'q.answers',
                'q.rightAnswers',
            ])

        return query;
    }

    //Возможно даже добавить отнимающие баллы
    //Добавить авто генерацию вопросов. Для этого описать паттерны генерации в бд. Доступ только для админов
    // 

    generateLevelRatio(levelSection: number, isAutoGenerated: Boolean, questionCount: number ): 
    {easy: number, middle: number, hard: number}{
        const levelRatio = {
            easy: (this.questionRelation[levelSection].easy),
            middle: (this.questionRelation[levelSection].middle),
            hard: (this.questionRelation[levelSection].hard),
        };
        
        let remain = !isAutoGenerated? this.questionRelation[levelSection].generated * 10: 0;
        // console.log(`LEVEL RATIO TEST ${remain}`);
        for (const level in levelRatio) {
            if(remain >= 0){
                const additional = Math.round((Math.random() * remain))
                remain -= additional;
                levelRatio[level] += additional/10; 
            }

            levelRatio[level] *= questionCount;
        }

        // console.log(levelRatio);

        return levelRatio;
    }
    
    async get(theme: string, passport: string): Promise<{list: DefaultQuestion[]}>{
        ['default', 'hard', 'othertype']
        // console.log('stage 0')
        const isAutoGenerated: Boolean = !!(await this.themeService.find(theme))?.isAutoGenerated;
        const section: number | null = await this.themeService.getGradeSection(theme, passport);
        const questionCount = 10;

        if((section !== 0 && !section)){
            throw new BadRequestException('Something went wrong');
        }
        // console.log(`grade section: ${section}`)
        // console.log('stage 1')
        // console.log(`isAutoGenerated ${isAutoGenerated}`)
        const levelRatio = this.generateLevelRatio(section, isAutoGenerated, questionCount);

        const easy = await (this.generateQuestionQuery(theme, 
            levelRatio.easy,
            [{key: 'level',value: QuestionLevel.easy}]))
            .getMany() as DefaultQuestion[]
        // console.log(`Easy questions: ${easy.length}`); 

        const middle = await (this.generateQuestionQuery(theme, 
            levelRatio.middle, 
            [{key: 'level',value: QuestionLevel.middle}]))
            .getMany() as DefaultQuestion[]
        // console.log(`Middle questions: ${middle.length}`)

        const hard = await (this.generateQuestionQuery(theme, 
            levelRatio.hard, 
            [{key: 'level',value: QuestionLevel.hard}]))
            .getMany() as DefaultQuestion[]
        // console.log(`Hard questions: ${hard.length}`)
        
        const remainCount = questionCount - easy.length - middle.length - hard.length;

        let list = [...easy, ...middle, ...hard];
        
        // console.log(`remain count: ${remainCount}`)

        if(isAutoGenerated && remainCount > 0){
            const generated: DefaultQuestion[] | null = await this.generator.getQuestion(theme, remainCount, QuestionLevel.easy, passport);

            if(generated === null){
                return {list};
            }

            list = [...list, ...generated];
        }

        return {list};
    }
    //14.11 Сборка вопросов кое как работает, нужно исключить повторение вопросов из типов сложности и типов вопросов (easy:order)
    //Плюс нужно посмотреть в сторону сохранения текущего набора вопросов, что бы пользователь не мог скипать их.
    //и добавить генератор сюда
    //

    private checkAnswerWithOrder(answers: number[], correctAnswers: number[], maxPoints: number): number{
        if(answers.length === correctAnswers.length){
            for(let i = 0; i < correctAnswers.length; i++){
                if(+answers[i] !== +correctAnswers[i]){
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
            if(answers.find(id => correctId == id) != undefined){
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
        // console.log(answers);
        // console.log(question);

        if(!question){
            throw new BadRequestException('Wrong question');
        }
        
        const points = this.checkAnswers(question.type, answers.rightAnswers, question.rightAnswers, question.maxPoints);
        if(await this.gradeService.addPoints(points, question.theme.id, passport)){
            if(genericTest[0] === 'generic'){
                this.generator.deleteQuestion(question.id);
            }
            return {points}
        }
        
        throw new BadRequestException("Something went wrong");
    }

    generateModeratingQuestionQuery(theme: string, limit: number = 1): SelectQueryBuilder<QuestionEntity>{
        const query = this.questionRepository.createQueryBuilder('q')
            .where('q.themeId = :themeId', { themeId: theme })
            .andWhere('q.moderationStatus = :moderationStatus', {moderationStatus: ModerationState.onModeration})
            // .andWhere('q.lastModeratorPassport = :val', {val: 'null'})
            .orderBy('RANDOM()')
            .limit(limit)
            .select([
                'q.id',
                'q.answers',
                'q.rightAnswers',
                'q.title',
                'q.level',
                'q.maxPoints',
                'q.type',
                'q.lastModeratorPassport',
            ]);

        return query;
    }
    
    saveModeratingInRam(){

    }

    writeOnModerationEntry(question: QuestionEntity, passport: string){
        this.ramDb.addEntry(`${question.id}:${passport}`, {}, {
            func: async () => {
                const moderationResult = (await (this.questionRepository.findOne({where: {id: question.id}, select: {moderationStatus: true}})))?.moderationStatus;
                if(moderationResult == ModerationState.onModeration){
                    await this.questionRepository.update({id: question.id}, {lastModeratorPassport: null});
                }
                this.ramDb.deleteEntry(`${question.id}:${passport}`)
            },
            time: this.ramDb.formatTime('3m')!
            }
        );
    }

    async getModerating(theme: string, limit: number = 1, passport: string): Promise<{questions: DefaultQuestion[]}>{
        const query = this.generateModeratingQuestionQuery(theme, limit);
        const questions = await query.getMany();

        if(questions.length == 0){
            throw new BadRequestException('No questions on moderating');
        }
        questions.forEach(val => {this.questionRepository.update({id: val.id}, {lastModeratorPassport: passport}); this.writeOnModerationEntry(val, passport)});
        
        return {questions}
    }

    async checkModerator(questionIds: string, passport: string){
        console.log("QUESTION IDS")
        const list = questionIds.split(',');
        const results: boolean[] = [];
        for(let id of list){
            const isExist = this.ramDb.findEntry(`${id}:${passport}`);
            if(isExist) {results.push(true); console.log("In ram-db"); continue;}

            const data = await this.questionRepository.findOne({where: {id}, select: {lastModeratorPassport: true}});
            if(!data) {results.push(false); continue;}

            if(data.lastModeratorPassport === passport){
                results.push(true);
                console.log("Passport: true");
                continue;
            }

            results.push(false);
        }

        return {questions: results};
    }

    async moderate(result: ModerationResult, passport: string){
        const {questionID, themeID, timestamp, approved } = result;
        const moderated = await (this.questionRepository.findOne({where: {id: questionID}, select: {lastModeratorPassport: true, moderationStatus: true, theme: true}}));

        if(!moderated || moderated.moderationStatus !== ModerationState.onModeration){
            throw new BadRequestException('Question not exists');
        }
        if(moderated.lastModeratorPassport !== passport){
            throw new ForbiddenException('Access denied');
        }

        if(approved){
            await this.questionRepository.update({id: questionID}, {moderationStatus: ModerationState.Published, moderator: {id:passport}});
        }
        else{
            await this.questionRepository.update({id: questionID}, {moderationStatus: ModerationState.Skipped, moderator: {id:passport}});
        }

        this.ramDb.deleteEntry(`${questionID}:${passport}`);
        //TODO: add a cooldown for moderating based on level/moderated count;
        return;
    }

    
    async createGenerationPattern(patternDto: GenerationPatternDTO, passport: string){
        const {theme} = patternDto;
        
        try{
            const isThemeExist = !!(await this.themeService.isExist(theme))

            if(!isThemeExist) throw {message: 'Theme not exist'}

            const isCreated = await this.generator.createPattern(patternDto);

            if(!isCreated) throw {message: 'Creating problem'}
        }   
        catch(err){
            throw new BadRequestException(`Something went wrong: ${err.message}`)
        }

        return; 
        //TODO: PAttern validation(chat gpt), pattern checking - generator, try catch scheme in pattern reader, testing.
    }
}

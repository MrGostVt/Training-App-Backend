import { Injectable } from '@nestjs/common';
import { AccessToActions, AccessToValues, add, Concat, decorateInFunction, divide, 
    formData, GenerateAnswersByData, GenNumberAnswers, GenQuestionID, log, multiply, randomNumber,
     RequestWBody, subtract, Val } from './pattern-functions/default.pattern-functions';
import { RamDbService } from 'src/ram-db/ram-db.service';
import { of, timeout } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { PatternsEntity } from './entity/patterns.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QuestionLevel } from 'src/common/enums/QuestionLevel.enum';
import { DefaultQuestion, GenericQuestionData, QuestionData } from 'src/common/types/Question.type';
import { GenerationPatternDTO } from 'src/common/dto/generation-pattern.dto';
import { IntegrationEntity } from 'src/theme/entity/integration.entity';
type InterObject = {
    payload: any[],
    funcs: any[],
}

@Injectable()
export class QuestionGeneratorService {
    'rnd=1=1000+rnd=12=13|rnd=2=10+rnd=2=10'
    "rnd=25=50,rnd=1=25|myValues=0=0@+-@myValues=0=1|setTitle==concat=myValues=0=0=concat=myActions=1=0=myValues=0=0|setAnswers==genNumAnswers=4=myValues=1=0"
    "rnd=25=50,rnd=1=25|myValues=0=0@+-@myValues=0=1|setTitle==concat=myValues=0=0=concat=myActions=1=0=myValues=0=1|setAnswers==genNumAnswers=4=myValues=1=0|setRightAnswers==myValues=1=0"

    private readonly separator = '|';
    private readonly smallSeparator = ',';
    private readonly equality = '=';
    private readonly actionSeparator = '@';
    private readonly patterns = {
        'rnd': randomNumber,
        'timeout': timeout,
        'function': decorateInFunction,
        'save': {},
        'delete': {},
        'find': {},
        'sendTo': {},
        'claim': {},
        'user': {},
        'setTitle': (args: [null, any], question) => {
            formData(['title',args[1]], question)
        },
        'setAnswers': (args: [null, any], question) => {formData(['answers',args[1]], question)},
        'setRightAnswers': (args: [null, any], question) => {
            const [, answer] = args;

            console.log(answer);
            const answers = question['answers'];
            if(!answers){
                throw 'Answers must be setted earlier then rightAnswers';
            }

            const rightAnswers = [answers.indexOf(answer)];
            console.log(answer, 'ANSWER!');
            console.log(question, 'QUESTION')
            if(rightAnswers[0] === -1){
                throw 'Right answer must exist in answers array';
            }

            formData(['rightAnswers', rightAnswers], question);
        },
        'formData': formData,
        'log': log,
        'myValues': AccessToValues,
        'myActions': AccessToActions,
        'val': Val,
        'concat': Concat,
        'concatWSpace': ((args: [string, string]) => Concat([args[0] + ' ', args[1]])),
        'genNumAnswers': GenNumberAnswers,
        'genQuestionId': GenQuestionID,
        'bodyRequest': RequestWBody,
        'additionalData': (args: [any, number], data: string[]) => {
            const [,index] = args;
            // console.log('ADDITIONAL DATA', args, data);
            if(data[index] == undefined) throw 'Wrong additional data!';
            return data[index];
        },
        'additionalDataLength': (data: string[]) => data.length,
        'assignObject': (args: [string, any]) => {
            const [key, value] = args;
            // console.log("assignObject", args);

            return {[key]: value};
        },
        'multiplyObjects': (args: [any, any]) => {
            const [obj1, obj2] = args;
            // console.log("MultiplyObject", args);

            return {...obj1, ...obj2};
        },
        'object': (args: [string, Object]) => {
            const [property, object] = args;
            console.log("Object", args);
            return object[property];
        },
        'array': (args: [number, any[]]) => {
            const [i, array] = args;
            console.log(args);
            return array[i];
        },
        'language': (language: string) => language,
        'generateDataAnswers': GenerateAnswersByData
    };
    private readonly defaultPatterns = {
        '+': add,
        '-': subtract,
        '*': multiply,
        '/': divide,
    };

    constructor(
        private readonly ramDbService: RamDbService,
        @InjectRepository(PatternsEntity) private readonly patternsRepository: Repository<PatternsEntity>,
    ){
        this.patterns.save = ramDbService.addEntry;
        this.patterns.delete = ramDbService.deleteEntry;
        this.patterns.find = ramDbService.findEntry;
    }

    segmentPattern(pattern: string): string[] | null{
        try{
            const funcSections = pattern.split(this.separator);
            let logicalSegments: any[] = [];

            for(let section of funcSections){
                const separated = section.split(this.smallSeparator);
    
                for(let sep of separated){
                    const pattern = this.choseAction(sep);
    
                    const actions = this.readActions(pattern.payload[0]); //payload: [ 'log=myValues=0=0=myValues=0=1' ], funcs: [] }
                                                                         //payload: [ 'myValues=0=0', 'myValues=0=1' ], funcs: [ '/' ] }
                    logicalSegments = [...logicalSegments, ...actions.payload];                    
                }
            }

            return logicalSegments;
        }
        catch(err){
            return null;
        }
    }

    private choseAction(pattern: string): InterObject{
        const object: InterObject = {
            payload: [],
            funcs: []
        }
        const indexOfStart = pattern.indexOf(this.actionSeparator)+1;
        const indexOfEnd = pattern.lastIndexOf(this.actionSeparator);
    
        if(indexOfStart == 0){
            object.payload.push(pattern);
            return object;
        }
    
        const actions = pattern.slice(indexOfStart, indexOfEnd);
        
        const chosen = Math.round(Math.random() * (actions.length-1));
        const newPattern = pattern.split(`${this.actionSeparator}${actions}${this.actionSeparator}`).join(actions[chosen]);
    
        object.funcs.push(actions[chosen]);
        object.payload.push(newPattern);
    
        return object;
    }

    private readActions(section: string): InterObject{
        const object: InterObject = {
            payload: [],
            funcs: [],
        }
        let remain = section;
        const order = section.split('').filter(
            (val, i, arr) => Object.keys(this.defaultPatterns).includes(val) && arr[i-1] !== this.equality
        );
        
        for (const pattern of order) {
            const [action] = remain.split(pattern);
            remain = remain.split(`${action}${pattern}`).join('');

            object.payload.push(action);
            object.funcs.push(pattern);
        }
        object.payload.push(remain);

        return object;
    }

    private readFunctions(actions: string[]): InterObject{
        const object: InterObject = {
            payload: [],
            funcs: [],
        }
    
        let remain = actions;
    
        for(let section of remain){
            const parts = section.split(this.equality);
            const funcs = parts.filter(val => Object.keys(this.patterns).includes(val));
            let funcId = 0;
            let tempArgs: any[] = [];
            const args: any[] = [];
    
            for(let i in parts){
    
                if(parts[i] == funcs[funcId]){
                    funcId++;
                    if(i !== '0'){
                        args.push(tempArgs);
                        tempArgs = [];    
                    }
                    continue;
                }
                if(tempArgs.length === 2){
                    args.push(tempArgs);
                    tempArgs = [];    
                }
                tempArgs.push(parts[i]);
            }
            args.push(tempArgs);
            
            let counter = 0;
            while (args[args.length-1].length === 1){
                let badArg = args.pop();
    
                for(let key in args){
                    if(args[key].length === 1){
                        args[key].push(badArg.pop);
                        break;
                    }
                    if(args[key].length === 0){
                        args[key].push(null);
                        args[key].push(badArg.pop());
                        break;
                    }
                }
    
                counter++;
                if(counter >= 10){
                    break;
                }
            }
            object.payload.push(args);
            object.funcs.push(funcs);
        }
        
        return object;
    }

    private async runFunctions(functions: InterObject, interValues: any[], interActions: any[], 
        dataToReturn: any, integration: IntegrationEntity | undefined, language: string, additionalData: string[]): Promise<any[]>{
        let results: any[] = [];
        const args = functions.payload;
        const funcs = functions.funcs;

        for(let j = 0; j < funcs.length; j++){
            const lastValues: any = [];

            for(let i = funcs[j].length-1; i >= 0; i--){
                if(args[j][i].length !== 2 || args[j][i].includes(null)){
                    switch(args[j][i].length){
                        case 2: args[j][i][0] = lastValues.shift(); break;
                        case 1: args[j][i].push(lastValues.shift()); break;
                        case 0: 
                            const arg2 = lastValues.shift(); 
                            const arg1 = lastValues.shift(); 
                            args[j][i].push(arg1);
                            args[j][i].push(arg2);
                            break;
                        default: throw new Error("Pattern broken");
                    }
                }

                const functionKey = funcs[j][i];
                let result: any;
                // console.log(functionKey);
                switch(functionKey){
                    case 'setRightAnswers':
                    case 'setAnswers':
                    case 'setTitle':
                    case 'formData':
                        this.patterns[functionKey](args[j][i], dataToReturn);
                        break;
                    case 'myActions':
                        result = await this.patterns[functionKey](args[j][i], interActions);
                        break;
                    case 'myValues': 
                        result = await this.patterns[functionKey](args[j][i], interValues);
                        break;
                    case 'paramRequest': 
                    case 'bodyRequest': 
                        if(!integration) throw 'Integration doesnt exist'
                        result = await this.patterns[functionKey](args[j][i], integration);
                        break;
                    case 'language':
                        result = await this.patterns[functionKey](language);
                        break;
                    case 'additionalData':
                        result = await this.patterns[functionKey](args[j][i], additionalData);
                        break;
                    case 'additionalDataLength':  
                        result = await this.patterns[functionKey](additionalData);
                        break;
                    case 'generateDataAnswers': 
                        result = await this.patterns[functionKey](args[j][i], additionalData);
                        break;
                    default:
                        result = await this.patterns[functionKey](args[j][i]);
                        break;
                }

                lastValues.push(result);
            }

            results = [...results, ...lastValues];
        }

        return results;
    }

    private runActions(funcs: string[], values: any[]): any[]{
        let actions: any[] = [...funcs];
        const loverOrder: any[] = [];
        const upperOrder: any[] = [];
        for(let i = 0; i < actions.length; i++){
            if(actions[i] == '*' || actions[i] == '/'){
                upperOrder.push(i);
                continue;
            }
            loverOrder.push(i);
        }
    
        const order = [...upperOrder, ...loverOrder];
        let counter = 0;
        
        while (values.length !== 1 && counter < order.length){
            const index = order[counter];
            const args = [values[index], values[index+1]];
            values[index+1] = null;
    
            const actionResult = this.defaultPatterns[actions[index]](args);
            values[index] = actionResult;
            actions[index] = null;
            // console.log(actionResult);
            order.forEach((val, i) => {
                if(val > index){
                    order[i]--;
                }
            })
            values = values.filter(val => val !== null);
            actions = actions.filter(val => val !== null);
    
            counter++;
        }
    
        return values;
    }

    async readPattern(patternInfo: PatternsEntity, language: string, passport?: string, integration?: IntegrationEntity): Promise<DefaultQuestion | null>{
        const pattern = patternInfo.pattern;
        const questionData = {
            id: GenQuestionID(...(passport ? [passport] : [])),
            level: patternInfo.level,
            maxPoints: patternInfo.maxPoints,
            type: patternInfo.type,
        };

        const additionalData = patternInfo.data? patternInfo.data.split(','): [];
        const tempData: GenericQuestionData = {
            answers: [],
            rightAnswers: [],
            title: ''
        };
        const funcSections = pattern.split(this.separator);
        const interValues: any[] = [];
        const interActions: any[] = [];


        try{
            for(let section of funcSections){
                const separated = section.split(this.smallSeparator);
                const values: any[] = [];
                let actionFuncs: any[] = [];
    
                for(let sep of separated){
                    const pattern = this.choseAction(sep);
    
                    const actions = this.readActions(pattern.payload[0]);
                    const functions = this.readFunctions([...actions.payload]);
                    console.log(`functions: ${functions.funcs}`)
                    const results = await this.runFunctions(functions, interValues, interActions, tempData, integration, language, additionalData);
                    const final = this.runActions([...actions.funcs], [...results])[0];
    
                    if(final === 0 || !!final && !Number.isNaN(final)){
                        values.push(final);
                    }
                    if(actions.funcs.length !== 0 && actionFuncs.length === 0){
                        actionFuncs = [...actions.funcs]
                    }
                }
    
                interActions.push(actionFuncs);
                interValues.push(values);
            }
    
            const dataToReturn: DefaultQuestion = {...questionData, ...tempData};
            this.ramDbService.addEntry(dataToReturn.id, {...tempData, patternId: patternInfo.id},
                {func: () => {this.ramDbService.deleteEntry(dataToReturn.id);}, time: this.ramDbService.formatTime('15m')!});
    
            return dataToReturn;
        }
        catch(err){
            throw `Generation error: ${err}`
        }
    }

    async checkAnswers(id: string): Promise<QuestionData | null>{
        const entry = this.ramDbService.findEntry(id) as GenericQuestionData;
        if(!entry){
            return null;
        }
        
        const pattern: PatternsEntity | null = await this.patternsRepository.findOne({where: {id: entry.patternId}, select: {theme: {id: true}}, relations: ['theme']});
        if(!pattern){
            return null;
        }
        const {title, answers, rightAnswers, theme, type, level, maxPoints} = {...entry, ...pattern}        
        return {id, title, answers, rightAnswers, theme, type, level, maxPoints} as QuestionData;
    }

    deleteQuestion(id: string): Boolean{
        return this.ramDbService.deleteEntry(id);
    }

    generateQuestionQuery(theme: string, limit: number, params: [{key: string, value: any}]): SelectQueryBuilder<PatternsEntity>{
        const query = this.patternsRepository.createQueryBuilder('pattern')
            .where('pattern.themeId = :themeId', { themeId: theme })
        for (const param of params) {
            query.andWhere(`pattern.${param.key} = :${param.key}`, {[param.key]: param.value})
        }

        query.orderBy('RANDOM()')
            .limit(limit)
        return query;
    }

    async getQuestion(themeId: string, count: number, level: QuestionLevel, language: string, passport?: string, integration?: IntegrationEntity): Promise<DefaultQuestion[] | null>{
        let patterns = (await (this.generateQuestionQuery(themeId, count, [{key: 'level', value: level}])).getMany());
        
        if(patterns.length === 0){
            return [];
        }

        if(patterns.length !== count){
            const min = patterns.length;
            const diff = count - patterns.length;

            for(let i = 0; i < diff; i++){
                const rndIndex = Math.floor(Math.random() * min);
                console.log(`RND INDEX ${rndIndex}`);
                patterns.push(patterns[rndIndex]);
            }
        }        

        console.log(`PATTERNS LENGTH`);
        console.log(patterns.length);

        const questions: (DefaultQuestion | null)[] = await Promise.all(patterns.map(async (val) => {
            try{
                console.log(`Read pattern: `)
                console.log(val.pattern)
                return await this.readPattern(val, language, passport, integration)
            }
            catch(err){
                console.log(`GetQuestions---${err}`);
                return null;
            }
        }));

        //Подумать, как лучше обыграть падение генератора на некоторых вопросах
        const nonNullQuestions: DefaultQuestion[] = questions.filter(
            (q) => q !== null
        );
        
        return nonNullQuestions;
    }

    FormReport(result: DefaultQuestion | null): string{
        if(!result) return 'Result is undefined';
        const problems: any[] = [];

        if(result.answers.length <= result.rightAnswers.length || result.answers.length < 2) problems.push('answers: Wrong length');
        if(result.rightAnswers.length < result.answers.length || result.rightAnswers.length < 1) problems.push(`rightAnswers: Wrong length`);
        if(result.title.length === 0) problems.push('title: Wrong length');

        return problems.join(',')
    }

    async testPattern(pattern: PatternsEntity, integration: IntegrationEntity | undefined, language: string){
        try{
            const result = await this.readPattern(pattern, language, '', integration);
            console.log(result);
            if(!result || result.answers.length < result.rightAnswers.length 
                || result.rightAnswers.length < 1 || result.title.length === 0){
                throw 'Wrong question data: ' + this.FormReport(result);
            }
        }
        catch(err){
            console.log(`TestPattern---${err}`);
            throw err;
        }

        return true;
    }

    async createPattern(patternData: GenerationPatternDTO, language: string, integration?: IntegrationEntity): Promise<Boolean>{
        const {theme, type, maxPoints, level, pattern, data} = patternData;

        const serializedData = (data && data.join(',') ) || null;

        const tempEntity = this.patternsRepository.create({
            theme: {id: theme},
            type,
            maxPoints,
            level,
            pattern,
            data: serializedData,
        });

        const isWork = await this.testPattern(tempEntity, integration, language);
        console.log(`Pattern is running, result: ${isWork}`);

        if(isWork){
            this.patternsRepository.save(tempEntity);
            return true;
        }
        
        throw ''; 
        // return false;
    }
}
//01.12 - Проблемы с генерацией, undefined в theme, 
//Проверить AnswerGeneration. Подключить фронт для удобного тестирования.
//02.12 - Протестить ответы, модерацию, левелинг, доступ по уровню.

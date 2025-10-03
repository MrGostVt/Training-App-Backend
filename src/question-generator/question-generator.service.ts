import { Injectable } from '@nestjs/common';
import { add, decorateInFunction, divide, multiply, randomNumber, subtract } from './pattern-functions/default.pattern-functions';
import { RamDbService } from 'src/ram-db/ram-db.service';
import { of, timeout } from 'rxjs';
type InterObject = {
    payload: any[],
    funcs: any[],
}

@Injectable()
export class QuestionGeneratorService {
    'rnd=1=1000+rnd=12=13|rnd=2=10+rnd=2=10'
    private readonly separator = '|';
    private readonly smallSeperator = ',';
    private readonly equality = '=';
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
        'return': {},
    };
    private readonly defaultPatterns = {
        '+': add,
        '-': subtract,
        '*': multiply,
        '/': divide,
    };

    constructor(
        private readonly ramDbService: RamDbService
    ){
        this.patterns.save = ramDbService.addEntry;
        this.patterns.delete = ramDbService.deleteEntry;
        this.patterns.find = ramDbService.findEntry;
    }

    private chunkArray(arr: any[], size: number): any[] {
        let result: any[] = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        return result;
    }

    readActions(section: string): InterObject{
        const object: InterObject = {
            payload: [],
            funcs: [],
        }
        let remain = section;
        const order = section.split('').filter(val => Object.keys(this.defaultPatterns).includes(val));
        
        for (const pattern of order) {
            const [action] = remain.split(pattern);
            remain = remain.split(`${action}${pattern}`).join('');

            object.payload.push(action);
            object.funcs.push(pattern);
        }
        object.payload.push(remain);

        return object;
    }

    readFunctions(actions: string[]): InterObject{
        const object: InterObject = {
            payload: [],
            funcs: [],
        }
    
        let remain = actions;
    
        for(let section of remain){
            const parts = section.split('=');
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

    runFunctions(functions: InterObject): any[]{
        let results: any[] = [];
        const args = functions.payload;
        const funcs = functions.funcs;


        for(let j = 0; j < funcs.length; j++){
            const lastValues: any[] = [];

            for(let i = funcs[j].length-1; i >= 0; i--){
                if(args[j][i].length !== 2 || args[j][i].includes(null)){
                    switch(args[j][i].length){
                        case 2: args[j][i][0] = lastValues.shift(); break;
                        case 1: args[j][i].push(lastValues.shift()); break;
                        case 0: args[j][i].push(lastValues.shift()); args[j][i].push(lastValues.shift()); break;
                        default: throw new Error("Pattern broken");
                    }
                }

                const functionKey = funcs[j][i];
                const result = this.patterns[functionKey](args[j][i]);

                lastValues.push(result);
            }
            results = [...results, ...lastValues];
        }

        return results;
    }

    runActions(funcs: string[], values: any[]): any[]{
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
            console.log(actionResult);
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

    'rnd=1=1000|rnd=1=1000|rnd=-1000=1000'
    async readPattern(pattern: string){
        const funcSections = pattern.split(this.separator);
        const interValues: any[] = [];

        for(let section of funcSections){
            const separated = section.split(this.smallSeperator);
            const values: any[] = [];

            for(let sep of separated){
                const actions = this.readActions(sep);
                const functions = this.readFunctions(actions.payload);
                
                const results = this.runFunctions(functions);
                const final = this.runActions(actions.funcs, results);

            }

            interValues.push(values);
        }

    }
}

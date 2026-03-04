import { IntegrationEntity } from "src/theme/entity/integration.entity";
import { json } from "stream/consumers";

type Arguments = [any, any];

export const randomNumber = (range: Arguments) => {
    try{
        const [val1, val2] = range.map(val => parseInt(val)); 
        const rndVal = Math.round((Math.random() * (val2 - val1) + val1)); 
        return rndVal;
    }
    catch(err){
        throw `Random number error, ${err.message}`;
    }

}

export const add = (values: Arguments) => {
    try{
        const [val1, val2] = values.map(val => parseInt(val)); 
        return (val1 + val2);
    }
    catch(err){
        throw `Add number error, ${err.message}`;
    }
}

export const subtract = (values: Arguments) => {
    try{
        const [val1, val2] = values.map(val => parseInt(val)); 
        return (val1 - val2);
    }
    catch(err){
        throw `Subtract number error, ${err.message}`;
    }
}

export const multiply = (values: Arguments) => {
    try{
        const [val1, val2] = values.map(val => parseInt(val)); 
        return (val1 * val2);
    }
    catch(err){
        throw `Multiply error, ${err.message}`;
    }
}

export const divide = (values: Arguments) => {
    try{
        const [val1, val2] = values.map(val => parseInt(val)); 
        return (val1 / val2);
    }
    catch(err){
        throw `Divide error, ${err.message}`;
    }
}

export const formData = (args: [string, any], returnData: object) => {
    try{
        const [key, value] = args;
        returnData[key] = value;
    }
    catch(err){
        throw `FormData error, ${err.message}`;
    }
}

export const log = (args: Arguments) => {
    try{
        const date = new Date();
        console.log(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}| ${args}`);
    }
    catch(err){
        throw `Log error, ${err.message}`;
    }
}

export const AccessToValues = (args: Arguments, values: any[]) => {
    try{
        const [j, i] = args; 
        return values[j][i];
    }
    catch(err){
        throw `AccessToValues error, ${err.message}`;
    }

}
export const AccessToActions = (args: Arguments, values: any[]) => {
    try{
        const [j, i] = args; 
        return values[j][i];
    }
    catch(err){
        throw `AccessToActions error, ${err.message}`;
    }
}

export const Val = () => (args: Arguments) => {
    try{
        const [plug, val] = args; 
        return val;
    }
    catch(err){
        throw `Val error, ${err.message}`;
    }
}

export const Concat = (args: Arguments) => {
    try{
        const [val1, val2] = args.map(val => val.toString()); 
        return val1+val2;
    }
    catch(err){
        throw `Concat error, ${err.message}`;
    }
}

export const GenNumberAnswers = (args: Arguments) => {
    try{
        const [count, answer] = args.map(val => parseInt(val));
        const answers: any[] = [];
        const answerIndex = randomNumber([0,count]);
        for(let i = 0; i < count; i++){
            if(answerIndex === i){
                answers.push(answer);
                continue;
            }
    
            let rnd = randomNumber([-30, 30]);
            if(answers.indexOf(rnd) !== -1){
                rnd += randomNumber([-31, 33]);
            }
            answers.push(answer + rnd);
        }
    
        console.log(`answer: ${answer}`)
        console.log(answers);
        return answers;
    }
    catch(err){
        throw `Number answers generating error, ${err.message}`;
    }
}

export const GenQuestionID = (...details: string[]) => {
    try{
        let id = `generic:${+(new Date())}`;
    
        for(const detail of details){
            id.concat(`:${detail}`);
        }
    
        return id.toString();    
    }
    catch(err){
        throw `ID generation error, ${err.message}`;
    }
}

export const timeout = (values: [object, number]) => {
    return {func: values[0], time: values[1]}
}

export const decorateInFunction = (values: Array<() => void>) => {
    return () => {
        for(let value of values){
            value();
        }
    }
}

export const RequestWBody = async (values: [any, any], integration: IntegrationEntity & {params, headers}) => {
    const [,field] = values;

    const request = {
        headers: {
            ...integration.headers
        },
        method: 'POST',
        body: JSON.stringify({
            ...integration.params,
            ...field
        })
    };

    try{
        const responce = await fetch(integration.service, request);

        if(responce.status > 400) throw {
            message: `${responce.status} Something went wrong`,
            details: responce.text
        }
        const result = await responce.json();
        // console.log('request:');
        // console.log(request);
        // console.log('request result');
        // console.log(result);

        return result;
    }
    catch(err){
        throw 'Wrong request. ' + err.message;
    }
}

export const GenerateAnswersByData = (args: [number, string], data: string[]) => {
    const [count, correct] = args;
    const range = data.filter(val => val !== correct);
    const result: string[] = [correct];

    console.log('GENERATE ANSWERS');
    console.log(args);
    
    for(let i = 0; i < count; i++){
        const rndIndex = randomNumber([0, range.length-1]);
        result.push(range.splice(rndIndex, 1)[0]);
    }
    return result;
}
type Arguments = [any, any];

export const randomNumber = (range: Arguments) => {
    const [val1, val2] = range.map(val => parseInt(val)); 
    const rndVal = Math.round((Math.random() * (val2 - val1) + val1)); 
    return rndVal;
}

export const add = (values: Arguments) => {
    const [val1, val2] = values.map(val => parseInt(val)); 
    return (val1 + val2);
}

export const subtract = (values: Arguments) => {
    const [val1, val2] = values.map(val => parseInt(val)); 
    return (val1 - val2);
}

export const multiply = (values: Arguments) => {
    const [val1, val2] = values.map(val => parseInt(val)); 
    return (val1 * val2);
}

export const divide = (values: Arguments) => {
    const [val1, val2] = values.map(val => parseInt(val)); 
    return (val1 / val2);
}

export const formData = (args: [string, any], returnData: object) => {
    const [key, value] = args;
    returnData[key] = value;
}

export const log = (args: Arguments) => {
    const date = new Date();
    console.log(`${date.getHours}:${date.getMinutes}:${date.getSeconds()}| ${args}`);
}

export const AccessToValues = (args: Arguments, values: any[]) => {
    const [j, i] = args; 
    return values[j][i]
}
export const AccessToActions = (args: Arguments, values: any[]) => {
    const [j, i] = args; 
    return values[j][i]
}

export const Val = () => (args: Arguments) => {
    const [plug, val] = args; return val;
}

export const Concat = (args: Arguments) => {
    const [val1, val2] = args.map(val => val.toString()); 
    return val1+val2
}

export const GenNumberAnswers = (args: Arguments) => {
    const [count, answer] = args.map(val => parseInt(val));
    const answers: any[] = [];
    for(let i = 0; i < count; i++){
        let rnd = randomNumber([-30, 30]);
        if(answers.indexOf(rnd) !== -1){
            rnd += randomNumber([-31, 33]);
        }
        answers.push(answer + rnd);
    }
    return answers;
}

export const GenQuestionID = (...details: string[]) => {
    let id = `generic:${+(new Date())}`;
    
    for(const detail of details){
        id.concat(`:${detail}`);
    }

    return id.toString();
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
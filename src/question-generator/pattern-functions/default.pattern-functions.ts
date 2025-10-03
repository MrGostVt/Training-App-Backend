export const randomNumber = (range: [number, number]) => {
    return (Math.random() * (range[1] - range[0])) + range[0];
}

export const add = (values: [number, number]) => {
    return (values[0] + values[1]);
}

export const subtract = (values: [number, number]) => {
    return (values[0] - values[1]);
}

export const multiply = (values: [number, number]) => {
    return (values[0] * values[1]);
}

export const divide = (values: [number, number]) => {
    return (values[0] / values[1]);
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
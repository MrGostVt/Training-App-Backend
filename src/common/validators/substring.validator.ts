import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator"
import { Content } from "../enums/content.enum";

type Options = {
    minQty: number[],
    allRequired: boolean,
    qtyProperty: string[],
}


export function IsContains(content: Content[], validationOptions: Options = {minQty: [], allRequired: true, qtyProperty: []}){
    return function(object: Object, propertyName: string){
        let missingTypes: string[]
        registerDecorator({
            name: 'IsContainType',
            target: object.constructor,
            propertyName,
            constraints: content,
            validator: {
                async validate(value: any, args: ValidationArguments): Promise<boolean>{
                    missingTypes = [...args.constraints];
                    const content = args.constraints;
                    
                    
                    if(typeof value !== 'string'){
                        return false;
                    }

                    let success = 0;
                    content.forEach((val: Content, i: number) => {
                        const target = value.split("");
                        const rightQty = validationOptions.minQty[i] === undefined? 
                            validationOptions.qtyProperty[i] !== undefined? args.object[validationOptions.qtyProperty[i]].length:
                            0: validationOptions.minQty[i];
                        let qty;
                        switch(val){
                            case Content.Number: 
                                qty = target.filter((value) => {
                                    return !Number.isNaN(+value);
                                }).length; 
                                break;
                            case Content.UpperCase:
                                qty = target.filter((value) => {
                                    return value === value.toUpperCase() && Number.isNaN(+value);
                                }).length;
                                break;
                            case Content.OrderSplitter:
                                qty = target.filter((value, i, array) => {
                                    if(i + 1 < array.length && i - 1 > 0) return value + array[i+1] === Content.OrderSplitter && array[i-1] !== '_'
                                }).length;
                                break;
                            default: 
                                return false;
                        }
                        if(qty === 0 || qty < rightQty){
                            return false;
                        }

                        missingTypes.splice(i,1);
                        success++;
                    })
                    
                    return validationOptions.allRequired? success === content.length: success !== 0;
                },
                defaultMessage(args: ValidationArguments): string{
                    let types: string = '';
                    missingTypes.forEach((val, i, array) => { 
                        const rightQty = validationOptions.minQty[i] === undefined? 
                        validationOptions.qtyProperty[i] !== undefined? args.object[validationOptions.qtyProperty[i]].length:
                        0: validationOptions.minQty[i];
                        
                        const res = `${rightQty} ${val}${array.length-1 !== i? ', ': ';'}`;
                        types += res;
                    });
                    if(types.split('__').length > 1) {return `$property must containt: ${types}, on the title order preview`}
                    return `$property must containt: ${types}`;
                }
            }
        })
    }
}
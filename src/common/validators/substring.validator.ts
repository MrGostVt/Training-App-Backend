import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator"
import { Content } from "../enums/content.enum";

type Options = {
    minQty: number[],
    allRequired: boolean,
}


export function IsContains(content: Content[], validationOptions: Options = {minQty: [], allRequired: true}){
    const missingTypes: string[] = [...content];

    return function(object: Object, propertyName: string){
        registerDecorator({
            name: 'IsContainType',
            target: object.constructor,
            propertyName,
            constraints: content,
            validator: {
                async validate(value: any, args: ValidationArguments): Promise<boolean>{
                    const content = args.constraints;
                    
                    
                    if(typeof value !== 'string'){
                        return false;
                    }

                    let success = 0;
                    content.forEach((val: Content, i: number) => {
                        const target = value.split("");
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
                            default: 
                                return false;
                        }
                        if(qty === 0 || qty < validationOptions.minQty[i]){
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
                        const res = `${val}${array.length-1 !== i? ', ': ';'}`;
                        types += res;
                    });
                    return `$property must containt: ${types}`;
                }
            }
        })
    }
}
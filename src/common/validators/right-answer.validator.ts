import { isArray, registerDecorator, ValidationArguments, ValidationOptions } from "class-validator"
import { Content } from "../enums/content.enum";

export function IsRightCorrespondsToAnswers(){

    return function(object: Object, propertyName: string){
        registerDecorator({
            name: 'IsContainType',
            target: object.constructor,
            propertyName,
            validator: {
                async validate(value: any, args: ValidationArguments): Promise<boolean>{                    
                    
                    if(!isArray(value)){
                        return false;
                    }

                    let success = 0;
                    value.forEach((val) => {

                        if(val > 0 && val < value.length){
                            success++;
                        }
                    })

                    
                    return success === value.length;
                },
                defaultMessage(args: ValidationArguments): string{
                    let types: string = '';
                    return `$property must containt correct answer id's`;
                }
            }
        })
    }
}
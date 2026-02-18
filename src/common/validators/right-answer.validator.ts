import { isArray, registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator"
import { Content } from "../enums/content.enum";

@ValidatorConstraint({name: 'IsRightCorrespondsToAnswers', async: true})
class MyValidator implements ValidatorConstraintInterface {
    async validate(correct: any, args: ValidationArguments): Promise<boolean>{                    
        const object = args.object as any; // весь DTO
        const answers: string[] = object.answers;

        if(!isArray(correct) && answers.length >= correct.length){
            return false;
        }
        console.log('Array: True');
        console.log(correct, 'correct');
        console.log(answers, 'answers');
        let success = 0;
        correct.forEach((val) => {
            console.log(val, correct.length)
            if(val >= 0 && val < answers.length){
                success++;
            }
        })

        
        return success === correct.length;
    }
    
    defaultMessage(args: ValidationArguments): string{
        let types: string = '';
        return `$property must containt correct answer id's`;
    }
}
 
export function IsRightCorrespondsToAnswers(){

    return function(object: Object, propertyName: string){
        registerDecorator({
            name: 'IsContainType',
            target: object.constructor,
            propertyName,
            validator: MyValidator
                
        })
    }
}
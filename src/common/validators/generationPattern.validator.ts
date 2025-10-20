import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { QuestionGeneratorService } from 'src/question-generator/question-generator.service';

@ValidatorConstraint({ name: 'IsGenerationPattern', async: true })
@Injectable()
export class GenerationPatternValidator implements ValidatorConstraintInterface {
    private readonly allowedChars = /^[A-Za-z0-9=\-\+\*\/&\|,@]+$/;

    constructor(private readonly generator: QuestionGeneratorService) {}
    
    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {
        if(typeof value !== 'string'){
            return false;
        }

        const generalTest = this.allowedChars.test(value);
        if(!generalTest) return false;

        const segments = this.generator.segmentPattern(value);

        if(!segments){
            return false;
        }

        for(const segment of segments){
            const argumentCount = segment.split('').filter(val => val === '=').length;
            
            if(argumentCount % 2 !== 0){
                return false;
            }
        }

        return true;
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return `Wrong pattern.`;
    }

}
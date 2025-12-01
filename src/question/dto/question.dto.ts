import { IsArray, IsEnum, IsInt, IsNumber, IsString, Length, Max, Min } from "class-validator";
import { QuestionLevel } from "src/common/enums/QuestionLevel.enum";
import { QuestionType } from "src/common/enums/QuestionType.enum";
import { IsRightCorrespondsToAnswers } from "src/common/validators/right-answer.validator";

export class QuestionDTO{
    
    @IsString()
    @Length(5, 150)
    title: string;

    @IsEnum(QuestionLevel)
    level: QuestionLevel;

    @IsNumber({
        allowNaN: false, 
        allowInfinity: false, 
    })

    @IsEnum(QuestionType)
    type: QuestionType;

    @IsArray()
    @IsString({each: true})
    @Length(1, 50, {each: true})
    answers: string[];

    @IsArray()
    @IsInt({each: true})
    @Min(0, {each: true})
    @IsRightCorrespondsToAnswers()
    rightAnswers: number[];

    @IsString()
    theme: string;
}
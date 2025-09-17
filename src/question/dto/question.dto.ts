import { IsArray, IsEnum, IsInt, IsNumber, IsString, Length, Max, Min } from "class-validator";
import { QuestionLevel } from "src/common/enums/QuestionLevel.enum";
import { QuestionType } from "src/common/enums/QuestionType.enum";
import { IsRightCorrespondsToAnswers } from "src/common/validators/right-answer.validator";

export class QuestionDTO{
    
    @IsString()
    @Length(15, 150)
    title: string;

    @IsEnum(QuestionLevel)
    level: QuestionLevel;

    @IsNumber({
        allowNaN: false, 
        allowInfinity: false, 
    })

    @IsInt()
    @Min(2)
    @Max(10)
    maxPoints: number;

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
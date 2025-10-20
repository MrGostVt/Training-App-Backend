import { IsArray, IsEnum, IsInt, IsNumber, IsString, Length, Max, Min } from "class-validator";
import { QuestionLevel } from "src/common/enums/QuestionLevel.enum";
import { QuestionType } from "src/common/enums/QuestionType.enum";
import { IsRightCorrespondsToAnswers } from "src/common/validators/right-answer.validator";

export class AnswerDTO{
    @IsString()
    @Length(15, 150)
    questionID: string;

    @IsArray()
    @IsInt({each: true})
    @Min(0, {each: true})
    rightAnswers: number[];
}
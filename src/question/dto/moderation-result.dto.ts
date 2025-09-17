import { IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNumber, IsString, Length, Max, Min } from "class-validator";
import { QuestionLevel } from "src/common/enums/QuestionLevel.enum";
import { QuestionType } from "src/common/enums/QuestionType.enum";
import { IsRightCorrespondsToAnswers } from "src/common/validators/right-answer.validator";

export class ModerationResult{
    
    @IsString()
    @Length(15, 150)
    themeID: string;

    @IsString()
    @Length(15, 150)
    questionID: string;

    @IsBoolean()
    approved: boolean;

    @IsDate()
    timestamp: Date;
}
import { Transform } from "class-transformer";
import { IsEAN, IsEnum, IsInt, IsNotEmpty, IsNumber, IsNumberString, IsString, Length, Max, Min } from "class-validator";
import { QuestionLevel } from "src/common/enums/QuestionLevel.enum";
import { QuestionType } from "src/common/enums/QuestionType.enum";

export class GenerationPatternDTO{
    @IsString()
    @Length(3, 1000)
    @Transform(({value}) => {
        return value.split(' ').join('');
    })
    pattern: string;
    
    @IsEnum(QuestionLevel)
    level: QuestionLevel;
    
    @IsEnum(QuestionType)
    type: QuestionType;

    @IsNumberString()
    @Transform(({value}) => {
        return `${value}`;
    })
    theme: string;
    
    @IsNumber({allowNaN: false})
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Max(15)
    maxPoints: number;
}
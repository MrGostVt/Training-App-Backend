import { IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNumber, IsString, Length, Max, Min } from "class-validator";

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
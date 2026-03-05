import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CheckModerationDTO{
    @IsString()
    @IsNotEmpty()
    @Length(1)
    idList: string;
}
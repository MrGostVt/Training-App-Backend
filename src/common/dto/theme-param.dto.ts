import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class ThemeParamDTO{
    @IsString()
    @IsNotEmpty()
    @Length(1)
    theme: string;
}
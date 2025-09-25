import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class ThemeDTO{
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNumber({allowNaN: false})
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Max(1000)
    maxPoints: number;
}
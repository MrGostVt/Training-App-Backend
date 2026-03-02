import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class ArticleDto{
    @IsNotEmpty()
    @IsString()
    @Length(3, 65)
    title: string;

    @IsNotEmpty()
    @IsString()
    @Length(3, 15)
    header: string;

    @IsNotEmpty()
    @IsString()
    @Length(3, 150)
    description: string;

    @IsNotEmpty()
    @IsString()
    @Length(3, 10)
    background: string;
}
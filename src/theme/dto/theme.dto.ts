import { IsNotEmpty, IsString } from "class-validator";

export class ThemeDTO{
    @IsNotEmpty()
    @IsString()
    title: string;
}
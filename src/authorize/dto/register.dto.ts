import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Max, Min, minLength } from "class-validator";
import { Content } from "src/common/enums/content.enum";
import { IsContains } from "src/common/validators/substring.validator";

export class RegisterDTO{
    @Length(3, 50)
    @IsNotEmpty()
    userName: string;
    
    @IsString()
    @IsNotEmpty()
    @Length(5, 50)
    @IsContains([Content.Number, Content.UpperCase], {minQty: [3,1], allRequired: true})
    password: string;
}
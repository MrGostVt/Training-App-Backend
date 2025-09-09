import { IsNotEmpty, IsString } from "class-validator";

export class AuthDataDTO{
    @IsNotEmpty()
    @IsString()
    userName: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}
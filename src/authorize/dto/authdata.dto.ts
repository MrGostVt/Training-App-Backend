import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class AuthDataDTO{
    @IsNotEmpty()
    @IsString()
    @Length(3, 75)
    @ApiProperty()
    userName: string;

    @IsNotEmpty()
    @IsString()
    @Length(5, 150)
    @ApiProperty({example: 'MyPassword123', description: 'Password must contain an uppercase and number symbols'})
    password: string;
}
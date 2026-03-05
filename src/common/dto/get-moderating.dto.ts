import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class GetModeratingDTO{
    @IsString()
    @IsNotEmpty()
    @Length(1)
    theme: string;

    @IsNumber({allowNaN: false, allowInfinity: false})
    @IsNotEmpty()
    limit: number;
}
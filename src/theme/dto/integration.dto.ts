import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDefined, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUrl, Length, Matches, Max, Min, ValidateNested } from "class-validator";
import { IntegrationMethods } from "src/common/enums/IntegrationMethods";

class IntegrationParamDto {
    @IsNotEmpty()
    @IsString()
    key: string;
  
    @IsNotEmpty()
    @IsString()
    value: string;
  }

export class IntegrationDto{
    
    @IsNotEmpty()
    @IsString()
    @Length(1)
    themeId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^https?:\/\/.+$/)
    service: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IntegrationParamDto)
    params: IntegrationParamDto[];
    
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IntegrationParamDto)
    headers: IntegrationParamDto[];

    @IsNotEmpty()
    @IsEnum(IntegrationMethods)
    method: IntegrationMethods;
}
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length} from "class-validator";
import { Content } from "src/common/enums/content.enum";
import { IsContains } from "src/common/validators/substring.validator";
import { CheckSymbols } from "src/common/validators/symbol.validator";

export class RegisterDTO{
    @Length(3, 50)
    @IsNotEmpty()
    userName: string;
    
    @IsString()
    @IsNotEmpty()
    @Length(5, 50)
    @IsContains([Content.Number, Content.UpperCase], {minQty: [3,1], allRequired: true, qtyProperty: []})
    // @CheckSymbols({blockedSymbols: '><'})
    password: string;

    @IsOptional()
    @IsBoolean()
    isAdmin: boolean;
}
import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator"

type Options = {
    blockedSymbols: string
}


export function CheckSymbols(validationOptions: Options = {blockedSymbols: ''}){
    return function(object: Object, propertyName: string){
        registerDecorator({
            name: 'CheckSymbols',
            target: object.constructor,
            propertyName,
            validator: {
                async validate(value: string, args: ValidationArguments): Promise<boolean>{
                    const chars: string[] = value.split('');
                    const blockedSymbols: string[] = validationOptions.blockedSymbols.split('');

                    return chars.filter((val) => {blockedSymbols.indexOf(val)}).length !== 0;
                },
                defaultMessage(args: ValidationArguments): string{
                    return `$Property must comply with the standarts`;
                }
            }
        })
    }
}
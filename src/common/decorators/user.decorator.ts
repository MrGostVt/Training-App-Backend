import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest.interfact";
import { AuthorizeEntity } from "src/authorize/entity/authorize.entity";
import { AccessLevel } from "../enums/AccessLevel.enum";



export const User = createParamDecorator((data: keyof AuthorizeEntity & {accessLevel: AccessLevel}, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const language = request.headers['X-target-language'] || 'ua';

    const user: AuthorizeEntity & {accessLevel: AccessLevel, language: string} = {...request.user, language};
    return data? user[data]: user;
}) as <K extends keyof (AuthorizeEntity & { accessLevel: AccessLevel, language: string })>(
    data?: K
) => ParameterDecorator;
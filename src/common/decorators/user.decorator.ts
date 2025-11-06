import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest.interfact";
import { AuthorizeEntity } from "src/authorize/entity/authorize.entity";
import { AccessLevel } from "../enums/AccessLevel.enum";



export const User = createParamDecorator((data: keyof AuthorizeEntity & {accessLevel: AccessLevel}, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: AuthorizeEntity & {accessLevel: AccessLevel} = request.user;

    return data? user[data]: user;
}) as <K extends keyof (AuthorizeEntity & { accessLevel: AccessLevel })>(
    data?: K
) => ParameterDecorator;
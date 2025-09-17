import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest.interfact";
import { AuthorizeEntity } from "src/authorize/entity/authorize.entity";



export const User = createParamDecorator((data: keyof AuthorizeEntity, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return data? user[data]: user;
});
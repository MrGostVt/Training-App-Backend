import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { AccessLevel } from "../enums/AccessLevel.enum";


export const Access = (...roles: AccessLevel[]) => SetMetadata('roles', roles);
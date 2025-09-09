import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../../authorize/guard/jwt.guard";
import { AccessGuard } from "../guards/access.guard";

export function Auth(){
    return applyDecorators(UseGuards(JwtGuard, AccessGuard));
}
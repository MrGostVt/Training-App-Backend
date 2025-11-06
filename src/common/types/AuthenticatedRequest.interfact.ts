import { AuthorizeEntity } from "src/authorize/entity/authorize.entity";
import { AccessLevel } from "../enums/AccessLevel.enum";

export interface AuthenticatedRequest extends Request{
    user: AuthorizeEntity & {accessLevel: AccessLevel}
}
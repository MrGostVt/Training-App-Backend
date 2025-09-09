import { AuthorizeEntity } from "src/authorize/entity/authorize.entity";

export interface AuthenticatedRequest extends Request{
    user: AuthorizeEntity
}
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { TokenData } from "../type/tokenData.type";
import { AuthorizeService } from "../authorize.service";
import { AuthorizeEntity } from "../entity/authorize.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authorizeService: AuthorizeService,
    private readonly configService: ConfigService,
  ) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        passReqToCallback: true
    });
  }

  async validate(req: Request, payload: TokenData): Promise<AuthorizeEntity> {
    const userAgent = req.headers['user-agent']; 
    const user = await this.authorizeService.authByTokenPayload(payload, userAgent);
    return user;
  }
}
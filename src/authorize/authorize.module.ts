import { Module } from '@nestjs/common';
import { AuthorizeService } from './authorize.service';
import { AuthorizeController } from './authorize.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizeEntity } from './entity/authorize.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJWTConfig } from 'src/config/jwt.config';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './strategy/jwt-auth.strategy';

@Module({
  controllers: [AuthorizeController],
  providers: [AuthorizeService, JwtStrategy],
  imports: [PassportModule, TypeOrmModule.forFeature([AuthorizeEntity]), JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: getJWTConfig,
  }), UserModule, ConfigModule]
})
export class AuthorizeModule {}

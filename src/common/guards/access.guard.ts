import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest.interfact';
import { AccessLevel } from '../enums/AccessLevel.enum';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AccessLevel[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isHasAccess = requiredRoles.some((role) => user.accessLevel >= role);
    if(!isHasAccess){
      throw new ForbiddenException("Access denied");
    }
    return isHasAccess;
  }
}
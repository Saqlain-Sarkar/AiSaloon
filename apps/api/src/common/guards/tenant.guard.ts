import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const businessId = request.params.businessId || request.query.businessId || request.body?.businessId;

    if (!user || !user.businessId) {
      throw new ForbiddenException('No tenant context');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (businessId && businessId !== user.businessId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    request.tenantId = user.businessId;
    return true;
  }
}

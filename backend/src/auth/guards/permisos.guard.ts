import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY } from '../../common/decorators/permisos.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * Guard de permisos. Revisa @Permisos(...) en la ruta.
 * El rol 'Administrador' siempre tiene acceso.
 */
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermisos = this.reflector.getAllAndOverride<string[]>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermisos || requiredPermisos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const roles: string[] = user?.roles ?? [];
    const permisos: string[] = user?.permisos ?? [];

    if (roles.includes('Administrador')) return true;
    if (requiredPermisos.some((permiso) => permisos.includes(permiso))) {
      return true;
    }

    throw new ForbiddenException(
      'No tiene el permiso necesario para realizar esta acción.',
    );
  }
}

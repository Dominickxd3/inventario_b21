import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioAutenticado {
  idUsuario: number;
  usuario: string;
  roles: string[];
  permisos: string[];
}

/**
 * Devuelve el usuario autenticado (inyectado por JwtStrategy.validate).
 * Uso: @UsuarioActual() usuario: UsuarioAutenticado
 */
export const UsuarioActual = createParamDecorator(
  (data: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UsuarioAutenticado | undefined;
    return data ? user?.[data] : user;
  },
);

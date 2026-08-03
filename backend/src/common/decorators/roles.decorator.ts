import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restringe una ruta a roles específicos.
 * Ejemplo: @Roles('Administrador') o @Roles('Administrador', 'Comandancia')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

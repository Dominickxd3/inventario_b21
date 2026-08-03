import { SetMetadata } from '@nestjs/common';

export const PERMISOS_KEY = 'permisos';

/**
 * Restringe una ruta a permisos específicos.
 * Ejemplo: @Permisos('Registrar bienes', 'Editar bienes')
 */
export const Permisos = (...permisos: string[]) =>
  SetMetadata(PERMISOS_KEY, permisos);

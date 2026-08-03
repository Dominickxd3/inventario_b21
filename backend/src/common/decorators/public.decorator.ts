import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como pública (se omite el guard JWT global).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

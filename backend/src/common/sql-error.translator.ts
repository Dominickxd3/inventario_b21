import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

interface ErrorSql {
  number?: number;
  message?: string;
}

/**
 * Capa de traducción de errores SQL Server -> HTTP (compartida).
 *
 *   - Registro/bien inexistente (RAISERROR 'no existe') ....... 404 NotFound
 *   - Duplicidad (índice único 2601/2627) ...................... 409 Conflict
 *   - Datos inválidos / restricciones (547/515/'no es válido')  400 BadRequest
 *   - Cualquier otro error ..................................... 500 InternalServerError
 */
export function traducirErrorSql(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }

  const e = (error ?? {}) as ErrorSql;
  const numero = e.number;
  const mensaje = (e.message ?? 'Error inesperado al procesar la solicitud.').toString();
  const texto = mensaje.toLowerCase();

  if (numero === 2601 || numero === 2627) {
    throw new ConflictException(
      'Ya existe un registro con ese código, número de serie o código patrimonial.',
    );
  }

  if (numero === 547) {
    throw new BadRequestException(
      'La operación referencia un dato inexistente o inválido.',
    );
  }

  if (numero === 515) {
    throw new BadRequestException(
      'Falta un valor obligatorio para completar la operación.',
    );
  }

  if (texto.includes('no existe')) {
    throw new NotFoundException(mensaje);
  }

  if (texto.includes('ya existe')) {
    throw new ConflictException(mensaje);
  }

  if (
    texto.includes('debe ser') ||
    texto.includes('no es válido') ||
    texto.includes('no es válida') ||
    texto.includes('no válido') ||
    texto.includes('no válida') ||
    texto.includes('obligatorio')
  ) {
    throw new BadRequestException(mensaje);
  }

  throw new InternalServerErrorException(
    'Error inesperado al procesar la solicitud.',
  );
}

/** Ejecuta una operación de BD y traduce sus errores SQL a HTTP. */
export async function ejecutarSql<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    traducirErrorSql(error);
  }
}

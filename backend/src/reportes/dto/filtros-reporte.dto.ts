import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Filtros opcionales para reportes por periodo.
 * El tipo de movimiento (idTipoMovimiento) sigue el catálogo
 * TB_TipoMovimiento: 1 Ingreso, 2 Salida, 3 Prestamo, 4 Devolucion,
 * 5 Transferencia, 6 Mantenimiento, 7 Baja, 8 Ajuste, 9 Emergencia.
 */
export class FiltrosReporteDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idTipoMovimiento?: number;
}

/** Reporte de movimientos por periodo (requiere rango de fechas). */
export class FiltrosMovimientosDto {
  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idTipoMovimiento?: number;
}

/** Parámetro de ruta del kardex (código interno B21-XXXXXX). */
export class CodigoB21Dto {
  @IsString()
  @Matches(/^B21-\d{6}$/i, {
    message: 'El código debe tener el formato B21-XXXXXX.',
  })
  codigoB21: string;
}

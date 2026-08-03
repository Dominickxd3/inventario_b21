import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearMovimientoDto {
  @IsInt()
  @Min(1)
  idTipoMovimiento: number;

  @IsInt()
  @Min(1)
  idBien: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEstadoNuevo?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idUbicacionNueva?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idResponsableNuevo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacion?: string;
}

import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RegistrarDevolucionDto {
  @IsInt()
  @Min(1)
  idEstadoRetorno: number;

  @IsInt()
  @Min(1)
  idBomberoRecibe: number;

  /** Nuevo responsable tras la devolución; null libera el bien. */
  @IsOptional()
  @IsInt()
  @Min(1)
  idResponsableNuevo?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacion?: string;
}

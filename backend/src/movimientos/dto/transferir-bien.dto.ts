import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TransferirBienDto {
  @IsInt()
  @Min(1)
  idBien: number;

  @IsInt()
  @Min(1)
  idNuevaUbicacion: number;

  /** Responsable nuevo; null transfiere solo ubicación. */
  @IsOptional()
  @IsInt()
  @Min(1)
  idNuevoResponsable?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}

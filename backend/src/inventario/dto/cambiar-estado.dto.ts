import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CambiarEstadoDto {
  @IsInt()
  @Min(1)
  idEstadoNuevo: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}

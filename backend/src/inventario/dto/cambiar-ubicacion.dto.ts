import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CambiarUbicacionDto {
  @IsInt()
  @Min(1)
  idUbicacionNueva: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}

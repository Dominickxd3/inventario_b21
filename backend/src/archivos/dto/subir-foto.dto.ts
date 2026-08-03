import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubirFotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoFoto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;
}

import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarArticuloDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de artículo es obligatorio.' })
  @MaxLength(20)
  codigoArticulo: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del artículo es obligatorio.' })
  @MaxLength(150)
  nombreArticulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['INDIVIDUAL', 'KIT', 'STOCK'], {
    message: 'El tipo de control debe ser INDIVIDUAL, KIT o STOCK.',
  })
  tipoControl: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

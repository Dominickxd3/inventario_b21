import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearArticuloDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de artículo es obligatorio.' })
  @MaxLength(20, { message: 'El código no debe exceder 20 caracteres.' })
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
  @IsNotEmpty({ message: 'El tipo de control es obligatorio.' })
  @IsIn(['INDIVIDUAL', 'KIT', 'STOCK'], {
    message: 'El tipo de control debe ser INDIVIDUAL, KIT o STOCK.',
  })
  tipoControl: string;
}

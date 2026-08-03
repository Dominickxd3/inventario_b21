import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearUsuarioDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  idBombero?: number;

  // Campos del bombero (obligatorios si no se indica idBombero)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoBombero?: string;

  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener exactamente 8 dígitos.' })
  dni?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  apellidos?: string;

  @IsString()
  @IsNotEmpty({ message: 'El usuario es obligatorio.' })
  @MaxLength(50)
  usuario: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  roles?: number[];
}

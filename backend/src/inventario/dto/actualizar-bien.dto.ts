import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ActualizarBienDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigoPatrimonial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroSerie?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  idMarca?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idModelo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  fechaIngreso?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  anioFabricacion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorAdquisicion?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}

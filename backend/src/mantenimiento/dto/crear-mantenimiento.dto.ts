import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RepuestoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del repuesto es obligatorio.' })
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoUnitario?: number;
}

export class CrearMantenimientoDto {
  @IsInt()
  @Min(1)
  idBien: number;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de mantenimiento es obligatorio.' })
  @MaxLength(50)
  tipoMantenimiento: string;

  @IsOptional()
  @IsString()
  diagnostico?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  idResponsableTecnico?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  repuestos?: RepuestoDto[];
}

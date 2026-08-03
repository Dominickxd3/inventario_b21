import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FinalizarMantenimientoDto {
  @IsOptional()
  @IsString()
  trabajoRealizado?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearPrestamoDto {
  @IsInt()
  @Min(1)
  idBien: number;

  @IsInt()
  @Min(1)
  idBomberoSolicitante: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idBomberoAutoriza?: number;

  @IsOptional()
  @IsDateString()
  fechaDevolucionProgramada?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacion?: string;
}

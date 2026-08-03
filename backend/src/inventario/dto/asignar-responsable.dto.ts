import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AsignarResponsableDto {
  @IsInt()
  @Min(1)
  idBombero: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}

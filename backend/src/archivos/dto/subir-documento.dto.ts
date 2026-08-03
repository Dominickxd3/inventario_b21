import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubirDocumentoDto {
  @IsNotEmpty({ message: 'El código del documento es obligatorio.' })
  @IsString()
  @MaxLength(30)
  codigo: string;

  @IsNotEmpty({ message: 'El tipo de documento es obligatorio.' })
  @IsString()
  @MaxLength(50)
  tipoDocumento: string;
}

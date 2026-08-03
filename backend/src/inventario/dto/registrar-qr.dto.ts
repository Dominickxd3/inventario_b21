import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegistrarQrDto {
  @IsString()
  @IsNotEmpty({ message: 'El contenido del QR es obligatorio.' })
  @MaxLength(200)
  contenidoQr: string;
}

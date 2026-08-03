import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ActualizarEstadoUsuarioDto {
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsBoolean()
  estado: boolean;
}

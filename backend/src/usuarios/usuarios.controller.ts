import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Permisos } from '../common/decorators/permisos.decorator';
import { ActualizarEstadoUsuarioDto } from './dto/actualizar-estado.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsuariosService } from './usuarios.service';
import type {
  DetalleUsuario,
  FilaPermiso,
  FilaUsuario,
} from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Permisos('Administrar usuarios')
  listar(): Promise<FilaUsuario[]> {
    return this.usuariosService.listar();
  }

  @Get(':id')
  @Permisos('Administrar usuarios')
  detalle(@Param('id', ParseIntPipe) id: number): Promise<DetalleUsuario> {
    return this.usuariosService.detalle(id);
  }

  @Get(':id/permisos')
  @Permisos('Administrar usuarios')
  permisos(@Param('id', ParseIntPipe) id: number): Promise<FilaPermiso[]> {
    return this.usuariosService.permisosUsuario(id);
  }

  @Post()
  @Permisos('Administrar usuarios')
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(dto);
  }

  @Patch(':id/estado')
  @Permisos('Administrar usuarios')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEstadoUsuarioDto,
  ) {
    return this.usuariosService.cambiarEstado(id, dto);
  }

  @Post(':id/reset-password')
  @Permisos('Administrar usuarios')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usuariosService.resetPassword(id, dto);
  }
}

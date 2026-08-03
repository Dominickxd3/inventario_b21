import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Permisos } from '../common/decorators/permisos.decorator';
import { RolesService } from './roles.service';
import type { FilaPermiso, FilaRol } from './roles.service';

class AsignarPermisosDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  idPermisos: number[];
}

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permisos('Administrar usuarios')
  listar(): Promise<FilaRol[]> {
    return this.rolesService.listar();
  }

  @Get(':id/permisos')
  @Permisos('Administrar usuarios')
  permisos(@Param('id', ParseIntPipe) id: number): Promise<FilaPermiso[]> {
    return this.rolesService.permisosDeRol(id);
  }

  @Get(':id/usuarios')
  @Permisos('Administrar usuarios')
  usuarios(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.usuariosDeRol(id);
  }

  @Put(':id/permisos')
  @Permisos('Administrar usuarios')
  asignarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarPermisosDto,
  ) {
    return this.rolesService.asignarPermisos(id, dto.idPermisos);
  }
}

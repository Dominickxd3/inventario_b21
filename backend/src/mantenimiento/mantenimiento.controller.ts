import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Permisos } from '../common/decorators/permisos.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { CrearMantenimientoDto } from './dto/crear-mantenimiento.dto';
import { FinalizarMantenimientoDto } from './dto/finalizar-mantenimiento.dto';
import { MantenimientoService } from './mantenimiento.service';

@Controller('mantenimientos')
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Get()
  @Permisos('Consultar inventario')
  listarMantenimientos(
    @Query('filtro') filtro?: string,
    @Query('idBien') idBien?: string,
    @Query('estado') estado?: string,
    @Query('pagina') pagina?: string,
    @Query('filas') filas?: string,
  ) {
    return this.mantenimientoService.listarMantenimientos(
      filtro,
      this.aNumero(idBien),
      estado,
      this.aNumero(pagina) ?? 1,
      this.aNumero(filas) ?? 50,
    );
  }

  @Get(':id')
  @Permisos('Consultar inventario')
  obtenerMantenimiento(@Param('id', ParseIntPipe) id: number) {
    return this.mantenimientoService.obtenerMantenimiento(id);
  }

  @Post()
  @Permisos('Registrar mantenimiento')
  registrarMantenimiento(
    @Body() dto: CrearMantenimientoDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.mantenimientoService.registrarMantenimiento(dto, idUsuario);
  }

  @Post(':id/finalizar')
  @Permisos('Registrar mantenimiento')
  finalizarMantenimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalizarMantenimientoDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.mantenimientoService.finalizarMantenimiento(id, dto, idUsuario);
  }

  private aNumero(valor?: string): number | undefined {
    if (valor === undefined || valor === '') {
      return undefined;
    }
    const n = Number(valor);
    return Number.isInteger(n) ? n : undefined;
  }
}

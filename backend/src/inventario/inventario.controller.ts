import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Permisos } from '../common/decorators/permisos.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { ActualizarArticuloDto } from './dto/actualizar-articulo.dto';
import { ActualizarBienDto } from './dto/actualizar-bien.dto';
import { AsignarResponsableDto } from './dto/asignar-responsable.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CambiarUbicacionDto } from './dto/cambiar-ubicacion.dto';
import { CrearArticuloDto } from './dto/crear-articulo.dto';
import { RegistrarBienDto } from './dto/registrar-bien.dto';
import { RegistrarQrDto } from './dto/registrar-qr.dto';
import { InventarioService } from './inventario.service';

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /* ------------------------- Catálogos ------------------------- */

  @Get('catalogos')
  @Permisos('Consultar inventario')
  catalogos() {
    return this.inventarioService.catalogos();
  }

  /* ------------------------- Artículos ------------------------- */

  @Get('articulos')
  @Permisos('Consultar inventario')
  listarArticulos(
    @Query('filtro') filtro?: string,
    @Query('incluirInactivos') incluirInactivos?: string,
  ) {
    return this.inventarioService.listarArticulos(
      filtro,
      incluirInactivos === 'true' || incluirInactivos === '1',
    );
  }

  @Post('articulos')
  @Permisos('Registrar bienes')
  crearArticulo(@Body() dto: CrearArticuloDto) {
    return this.inventarioService.crearArticulo(dto);
  }

  @Patch('articulos/:id')
  @Permisos('Editar bienes')
  actualizarArticulo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarArticuloDto,
  ) {
    return this.inventarioService.actualizarArticulo(id, dto);
  }

  /* ------------------------- Bienes ------------------------- */

  @Get('bienes')
  @Permisos('Consultar inventario')
  listarBienes(
    @Query('filtro') filtro?: string,
    @Query('idArticulo') idArticulo?: string,
    @Query('idEstado') idEstado?: string,
    @Query('idUbicacion') idUbicacion?: string,
    @Query('idResponsable') idResponsableActual?: string,
  ) {
    return this.inventarioService.listarBienes(
      filtro,
      this.aNumero(idArticulo),
      this.aNumero(idEstado),
      this.aNumero(idUbicacion),
      this.aNumero(idResponsableActual),
    );
  }

  private aNumero(valor?: string): number | undefined {
    if (valor === undefined || valor === '') {
      return undefined;
    }
    const n = Number(valor);
    return Number.isInteger(n) ? n : undefined;
  }

  @Get('bienes/:codigo')
  @Permisos('Consultar inventario')
  fichaBien(@Param('codigo') codigo: string) {
    return this.inventarioService.fichaBien(codigo);
  }

  @Post('bienes')
  @Permisos('Registrar bienes')
  registrarBien(
    @Body() dto: RegistrarBienDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.inventarioService.registrarBien(dto, idUsuario);
  }

  @Patch('bienes/:id')
  @Permisos('Editar bienes')
  actualizarBien(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarBienDto,
  ) {
    return this.inventarioService.actualizarBien(id, dto);
  }

  @Post('bienes/:id/cambiar-estado')
  @Permisos('Editar bienes')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.inventarioService.cambiarEstado(id, dto);
  }

  @Post('bienes/:id/asignar-responsable')
  @Permisos('Editar bienes')
  asignarResponsable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarResponsableDto,
  ) {
    return this.inventarioService.asignarResponsable(id, dto);
  }

  @Post('bienes/:id/cambiar-ubicacion')
  @Permisos('Editar bienes')
  cambiarUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarUbicacionDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.inventarioService.cambiarUbicacion(id, dto, idUsuario);
  }

  @Post('bienes/:codigo/qr')
  @Permisos('Registrar bienes')
  registrarQr(
    @Param('codigo') codigo: string,
    @Body() dto: RegistrarQrDto,
  ) {
    return this.inventarioService.registrarQr(codigo, dto.contenidoQr);
  }

  @Get('bienes/:codigo/qr/png')
  @Permisos('Consultar inventario')
  async qrPng(@Param('codigo') codigo: string, @Res() res: Response) {
    const buffer = await this.inventarioService.generarPngQr(codigo);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="${codigo}.png"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}

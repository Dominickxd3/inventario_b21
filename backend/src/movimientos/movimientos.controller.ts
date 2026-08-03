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
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { CrearPrestamoDto } from './dto/crear-prestamo.dto';
import { RegistrarDevolucionDto } from './dto/registrar-devolucion.dto';
import { TransferirBienDto } from './dto/transferir-bien.dto';
import { MovimientosService } from './movimientos.service';

@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get()
  @Permisos('Consultar inventario')
  listarMovimientos(
    @Query('filtro') filtro?: string,
    @Query('idTipoMovimiento') idTipoMovimiento?: string,
    @Query('idBien') idBien?: string,
    @Query('pagina') pagina?: string,
    @Query('filas') filas?: string,
  ) {
    return this.movimientosService.listarMovimientos(
      filtro,
      this.aNumero(idTipoMovimiento),
      this.aNumero(idBien),
      this.aNumero(pagina) ?? 1,
      this.aNumero(filas) ?? 50,
    );
  }

  @Get(':id')
  @Permisos('Consultar inventario')
  obtenerMovimiento(@Param('id', ParseIntPipe) id: number) {
    return this.movimientosService.obtenerMovimiento(id);
  }

  @Post()
  @Permisos('Editar bienes')
  registrarMovimiento(
    @Body() dto: CrearMovimientoDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.movimientosService.registrarMovimiento(dto, idUsuario);
  }

  @Post('transferencia')
  @Permisos('Editar bienes')
  transferirBien(
    @Body() dto: TransferirBienDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.movimientosService.transferirBien(dto, idUsuario);
  }

  private aNumero(valor?: string): number | undefined {
    if (valor === undefined || valor === '') {
      return undefined;
    }
    const n = Number(valor);
    return Number.isInteger(n) ? n : undefined;
  }
}

@Controller('kardex')
export class KardexController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get(':codigoB21')
  @Permisos('Consultar inventario')
  kardexBien(@Param('codigoB21') codigoB21: string) {
    return this.movimientosService.kardexBien(codigoB21);
  }
}

@Controller('prestamos')
export class PrestamosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get()
  @Permisos('Consultar inventario')
  listarPrestamos(
    @Query('filtro') filtro?: string,
    @Query('estado') estado?: string,
    @Query('idBien') idBien?: string,
    @Query('pagina') pagina?: string,
    @Query('filas') filas?: string,
  ) {
    return this.movimientosService.listarPrestamos(
      filtro,
      estado,
      this.aNumero(idBien),
      this.aNumero(pagina) ?? 1,
      this.aNumero(filas) ?? 50,
    );
  }

  @Get(':id')
  @Permisos('Consultar inventario')
  obtenerPrestamo(@Param('id', ParseIntPipe) id: number) {
    return this.movimientosService.obtenerPrestamo(id);
  }

  @Post()
  @Permisos('Registrar préstamo')
  registrarPrestamo(
    @Body() dto: CrearPrestamoDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.movimientosService.registrarPrestamo(dto, idUsuario);
  }

  @Post(':id/devolucion')
  @Permisos('Registrar devolución')
  registrarDevolucion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarDevolucionDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.movimientosService.registrarDevolucion(id, dto, idUsuario);
  }

  private aNumero(valor?: string): number | undefined {
    if (valor === undefined || valor === '') {
      return undefined;
    }
    const n = Number(valor);
    return Number.isInteger(n) ? n : undefined;
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CodigoB21Dto, FiltrosMovimientosDto } from './dto/filtros-reporte.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('dashboard')
  @Permisos('Generar reportes')
  dashboard() {
    return this.reportesService.dashboard();
  }

  @Get('inventario')
  @Permisos('Generar reportes')
  inventario() {
    return this.reportesService.inventarioGeneral();
  }

  @Get('kardex/:codigoB21')
  @Permisos('Generar reportes')
  kardex(@Param() params: CodigoB21Dto) {
    return this.reportesService.kardexBien(params.codigoB21);
  }

  @Get('prestamos')
  @Permisos('Generar reportes')
  prestamos() {
    return this.reportesService.prestamos();
  }

  @Get('mantenimiento')
  @Permisos('Generar reportes')
  mantenimiento() {
    return this.reportesService.mantenimiento();
  }

  @Get('movimientos')
  @Permisos('Generar reportes')
  movimientos(@Query() dto: FiltrosMovimientosDto) {
    return this.reportesService.movimientos(dto);
  }

  @Get('responsables')
  @Permisos('Generar reportes')
  responsables() {
    return this.reportesService.responsables();
  }
}
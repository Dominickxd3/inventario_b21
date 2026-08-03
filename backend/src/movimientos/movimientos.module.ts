import { Module } from '@nestjs/common';
import {
  KardexController,
  MovimientosController,
  PrestamosController,
} from './movimientos.controller';
import { MovimientosService } from './movimientos.service';

@Module({
  controllers: [MovimientosController, KardexController, PrestamosController],
  providers: [MovimientosService],
  exports: [MovimientosService],
})
export class MovimientosModule {}

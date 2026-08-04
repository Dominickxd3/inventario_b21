import { Injectable } from '@nestjs/common';
import { ejecutarSql } from '../common/sql-error.translator';
import { DatabaseService } from '../database/database.service';
import { FiltrosMovimientosDto } from './dto/filtros-reporte.dto';

/**
 * Módulo de reportes institucionales (FASE 6).
 * Solo lectura: no modifica bienes, movimientos ni kardex.
 * Toda la lógica de agregación vive en los stored procedures de SQL Server;
 * aquí solo se invocan y se estructuran sus result sets.
 */
@Injectable()
export class ReportesService {
  constructor(private readonly db: DatabaseService) {}

  /** Resumen general + series para gráficos (estados, mov/mes, costos/mes). */
  async dashboard() {
    const result = await ejecutarSql(() => this.db.execute('SP_DashboardResumen'));
    const rs = result.recordsets;
    return {
      resumen: rs?.[0]?.[0] ?? null,
      estados: rs?.[1] ?? [],
      movimientosPorMes: rs?.[2] ?? [],
      mantenimientosPorMes: rs?.[3] ?? [],
    };
  }

  /** Inventario general (todos los bienes activos). */
  async inventarioGeneral() {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ReporteInventarioGeneral'),
    );
    return result.recordset;
  }

  /** Historial completo de movimientos de un bien (kardex). */
  async kardexBien(codigoB21: string) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ReporteKardexBien', { CodigoInterno: codigoB21 }),
    );
    return result.recordset;
  }

  /** Préstamos con solicitante, autoriza, fechas y estado. */
  async prestamos() {
    const result = await ejecutarSql(() => this.db.execute('SP_ReportePrestamos'));
    return result.recordset;
  }

  /** Mantenimientos con costos de repuestos y costo total. */
  async mantenimiento() {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ReporteMantenimiento'),
    );
    return result.recordset;
  }

  /**
   * Movimientos por periodo (filtros: fecha inicio, fecha fin, tipo).
   * Devuelve detalle + agregado mensual.
   */
  async movimientos(dto: FiltrosMovimientosDto) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ReporteMovimientosPeriodo', {
        FechaInicio: dto.fechaInicio,
        FechaFin: dto.fechaFin,
        IdTipoMovimiento: dto.idTipoMovimiento ?? null,
      }),
    );
    const rs = result.recordsets;
    return {
      detalle: rs?.[0] ?? [],
      mensual: rs?.[1] ?? [],
    };
  }

  /** Responsables con cantidad de bienes asignados y sus equipos. */
  async responsables() {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ReporteResponsables'),
    );
    const rs = result.recordsets;
    return {
      resumen: rs?.[0] ?? [],
      detalle: rs?.[1] ?? [],
    };
  }
}
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ejecutarSql } from '../common/sql-error.translator';
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { CrearPrestamoDto } from './dto/crear-prestamo.dto';
import { RegistrarDevolucionDto } from './dto/registrar-devolucion.dto';
import { TransferirBienDto } from './dto/transferir-bien.dto';

export interface ObtenerMovimiento {
  cabecera: any;
  detalle: any[];
}

export interface ObtenerPrestamo {
  cabecera: any;
  detalle: any[];
}

@Injectable()
export class MovimientosService {
  constructor(private readonly db: DatabaseService) {}

  /* ------------------------- Movimientos ------------------------- */

  async listarMovimientos(
    filtro?: string,
    idTipoMovimiento?: number,
    idBien?: number,
    pagina = 1,
    filas = 50,
  ) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarMovimientos', {
        Filtro: filtro ?? null,
        IdTipoMovimiento: idTipoMovimiento ?? null,
        IdBien: idBien ?? null,
        Pagina: pagina,
        Filas: filas,
      }),
    );
    return {
      data: result.recordset,
      total: result.recordsets?.[1]?.[0]?.Total ?? 0,
    };
  }

  async obtenerMovimiento(id: number): Promise<ObtenerMovimiento> {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ObtenerMovimiento', { IdMovimiento: id }),
    );
    return {
      cabecera: result.recordsets?.[0]?.[0] ?? null,
      detalle: result.recordsets?.[1] ?? [],
    };
  }

  async registrarMovimiento(dto: CrearMovimientoDto, idUsuario: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarMovimientoV2', {
        IdTipoMovimiento: dto.idTipoMovimiento,
        IdBien: dto.idBien,
        IdUsuario: idUsuario,
        IdEstadoNuevo: dto.idEstadoNuevo ?? null,
        IdUbicacionNueva: dto.idUbicacionNueva ?? null,
        IdResponsableNuevo: dto.idResponsableNuevo ?? null,
        Observacion: dto.observacion ?? null,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  async transferirBien(dto: TransferirBienDto, idUsuario: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_TransferirBien', {
        IdBien: dto.idBien,
        IdNuevaUbicacion: dto.idNuevaUbicacion,
        IdNuevoResponsable: dto.idNuevoResponsable ?? null,
        IdUsuario: idUsuario,
        Motivo: dto.motivo ?? null,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  /* ------------------------- Kardex ------------------------- */

  async kardexBien(codigoB21: string) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ObtenerKardexBien', { CodigoInterno: codigoB21 }),
    );
    return result.recordset;
  }

  /* ------------------------- Préstamos ------------------------- */

  async listarPrestamos(
    filtro?: string,
    estado?: string,
    idBien?: number,
    pagina = 1,
    filas = 50,
  ) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarPrestamos', {
        Filtro: filtro ?? null,
        Estado: estado ?? null,
        IdBien: idBien ?? null,
        Pagina: pagina,
        Filas: filas,
      }),
    );
    return {
      data: result.recordset,
      total: result.recordsets?.[1]?.[0]?.Total ?? 0,
    };
  }

  async obtenerPrestamo(id: number): Promise<ObtenerPrestamo> {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ObtenerPrestamo', { IdPrestamo: id }),
    );
    return {
      cabecera: result.recordsets?.[0]?.[0] ?? null,
      detalle: result.recordsets?.[1] ?? [],
    };
  }

  async registrarPrestamo(dto: CrearPrestamoDto, idUsuario: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarPrestamo', {
        IdBien: dto.idBien,
        IdBomberoSolicitante: dto.idBomberoSolicitante,
        IdBomberoAutoriza: dto.idBomberoAutoriza ?? null,
        FechaDevolucionProgramada: dto.fechaDevolucionProgramada ?? null,
        Observacion: dto.observacion ?? null,
        IdUsuario: idUsuario,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  async registrarDevolucion(id: number, dto: RegistrarDevolucionDto, idUsuario: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarDevolucionV2', {
        IdPrestamo: id,
        IdEstadoRetorno: dto.idEstadoRetorno,
        Observacion: dto.observacion ?? null,
        IdBomberoRecibe: dto.idBomberoRecibe,
        IdResponsableNuevo: dto.idResponsableNuevo ?? null,
        IdUsuario: idUsuario,
      }),
    );
    return result.recordset?.[0] ?? null;
  }
}

import { Injectable } from '@nestjs/common';
import { ejecutarSql } from '../common/sql-error.translator';
import { DatabaseService } from '../database/database.service';
import { CrearMantenimientoDto } from './dto/crear-mantenimiento.dto';
import { FinalizarMantenimientoDto } from './dto/finalizar-mantenimiento.dto';

export interface ObtenerMantenimiento {
  cabecera: any;
  repuestos: any[];
}

/** Convierte el array de repuestos del DTO al formato XML del SP (SQL Server 2014). */
function repuestosAXml(repuestos: { nombre: string; cantidad?: number; costoUnitario?: number }[]): string {
  const escapar = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const items = repuestos
    .map(
      (r) =>
        `<i><n>${escapar(r.nombre)}</n><c>${r.cantidad ?? 1}</c><u>${r.costoUnitario ?? 0}</u></i>`,
    )
    .join('');

  return `<r>${items}</r>`;
}

@Injectable()
export class MantenimientoService {
  constructor(private readonly db: DatabaseService) {}

  async listarMantenimientos(
    filtro?: string,
    idBien?: number,
    estado?: string,
    pagina = 1,
    filas = 50,
  ) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarMantenimientos', {
        Filtro: filtro ?? null,
        IdBien: idBien ?? null,
        Estado: estado ?? null,
        Pagina: pagina,
        Filas: filas,
      }),
    );
    return {
      data: result.recordset,
      total: result.recordsets?.[1]?.[0]?.Total ?? 0,
    };
  }

  async obtenerMantenimiento(id: number): Promise<ObtenerMantenimiento> {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ObtenerMantenimiento', { IdMantenimiento: id }),
    );
    return {
      cabecera: result.recordsets?.[0]?.[0] ?? null,
      repuestos: result.recordsets?.[1] ?? [],
    };
  }

  async registrarMantenimiento(dto: CrearMantenimientoDto, idUsuario: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarMantenimiento', {
        IdBien: dto.idBien,
        TipoMantenimiento: dto.tipoMantenimiento,
        Diagnostico: dto.diagnostico ?? null,
        IdResponsableTecnico: dto.idResponsableTecnico ?? null,
        Observaciones: dto.observaciones ?? null,
        Repuestos: dto.repuestos?.length
          ? repuestosAXml(dto.repuestos)
          : null,
        IdUsuario: idUsuario,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  async finalizarMantenimiento(
    id: number,
    dto: FinalizarMantenimientoDto,
    idUsuario: number,
  ) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_FinalizarMantenimiento', {
        IdMantenimiento: id,
        TrabajoRealizado: dto.trabajoRealizado ?? null,
        Costo: dto.costo ?? 0,
        Observaciones: dto.observaciones ?? null,
        FechaFin: dto.fechaFin ?? null,
        IdUsuario: idUsuario,
      }),
    );
    return result.recordset?.[0] ?? null;
  }
}

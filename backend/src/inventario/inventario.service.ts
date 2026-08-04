import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { ejecutarSql } from '../common/sql-error.translator';
import { DatabaseService } from '../database/database.service';
import { ActualizarArticuloDto } from './dto/actualizar-articulo.dto';
import { ActualizarBienDto } from './dto/actualizar-bien.dto';
import { AsignarResponsableDto } from './dto/asignar-responsable.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CambiarUbicacionDto } from './dto/cambiar-ubicacion.dto';
import { CrearArticuloDto } from './dto/crear-articulo.dto';
import { RegistrarBienDto } from './dto/registrar-bien.dto';

export interface FichaBien {
  bien: any;
  relacion: any[];
  historialEstado: any[];
  historialAsignacion: any[];
  kardex: any[];
  fotos: any[];
  qr: any[];
}

export interface Catalogos {
  marcas: any[];
  modelos: any[];
  estados: any[];
  ubicaciones: any[];
  tiposMovimiento: any[];
}

@Injectable()
export class InventarioService {
  constructor(private readonly db: DatabaseService) {}

  /** Verifica que el bien exista y no esté eliminado (404 si no). */
  private async verificarBienExiste(idBien: number): Promise<void> {
    const fila = await ejecutarSql(() =>
      this.db.queryOne<{ Existe: number }>(
        'SELECT 1 AS Existe FROM dbo.TB_Bien WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0;',
        { IdBien: idBien },
      ),
    );
    if (!fila) {
      throw new NotFoundException('El bien no existe o está eliminado.');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Artículos                                                          */
  /* ------------------------------------------------------------------ */

  async listarArticulos(filtro?: string, incluirInactivos?: boolean) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarArticulos', {
        Filtro: filtro ?? null,
        IncluirInactivos: incluirInactivos ? 1 : 0,
      }),
    );
    return result.recordset;
  }

  async crearArticulo(dto: CrearArticuloDto) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarArticulo', {
        CodigoArticulo: dto.codigoArticulo,
        NombreArticulo: dto.nombreArticulo,
        Descripcion: dto.descripcion ?? null,
        TipoControl: dto.tipoControl,
      }),
    );
    return result.recordset?.[0] ?? { IdArticulo: null };
  }

  async actualizarArticulo(id: number, dto: ActualizarArticuloDto) {
    await ejecutarSql(() =>
      this.db.execute('SP_ActualizarArticulo', {
        IdArticulo: id,
        CodigoArticulo: dto.codigoArticulo,
        NombreArticulo: dto.nombreArticulo,
        Descripcion: dto.descripcion ?? null,
        TipoControl: dto.tipoControl,
        Estado: dto.estado === undefined ? 1 : dto.estado ? 1 : 0,
      }),
    );
    return { IdArticulo: id };
  }

  /* ------------------------------------------------------------------ */
  /* Bienes                                                             */
  /* ------------------------------------------------------------------ */

  async listarBienes(
    filtro?: string,
    idArticulo?: number,
    idEstado?: number,
    idUbicacion?: number,
    idResponsableActual?: number,
    pagina = 1,
    filas = 50,
  ) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarBienes', {
        Filtro: filtro ?? null,
        IdArticulo: idArticulo ?? null,
        IdEstado: idEstado ?? null,
        IdUbicacion: idUbicacion ?? null,
        IdResponsableActual: idResponsableActual ?? null,
        Pagina: pagina,
        Filas: filas,
      }),
    );
    return {
      data: result.recordset,
      total: result.recordsets?.[1]?.[0]?.Total ?? 0,
    };
  }

  async registrarBien(dto: RegistrarBienDto, idUsuario: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarBien', {
        IdArticulo: dto.idArticulo,
        CodigoPatrimonial: dto.codigoPatrimonial ?? null,
        NumeroSerie: dto.numeroSerie ?? null,
        IdMarca: dto.idMarca ?? null,
        IdModelo: dto.idModelo ?? null,
        Descripcion: dto.descripcion ?? null,
        IdEstado: dto.idEstado,
        IdUbicacion: dto.idUbicacion ?? null,
        IdResponsableActual: dto.idResponsableActual ?? null,
        FechaIngreso: dto.fechaIngreso ?? null,
        AñoFabricacion: dto.anioFabricacion ?? null,
        ValorAdquisicion: dto.valorAdquisicion ?? null,
        Observaciones: dto.observaciones ?? null,
        IdUsuario: idUsuario,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  async fichaBien(codigoInterno: string): Promise<FichaBien> {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ObtenerFichaBien', {
        CodigoInterno: codigoInterno,
      }),
    );
    const recordsets = result.recordsets;
    if (!recordsets?.length || !recordsets[0]?.length) {
      throw new NotFoundException('El bien no existe.');
    }
    return {
      bien: recordsets[0][0],
      relacion: recordsets[1] ?? [],
      historialEstado: recordsets[2] ?? [],
      historialAsignacion: recordsets[3] ?? [],
      kardex: recordsets[4] ?? [],
      fotos: recordsets[5] ?? [],
      qr: recordsets[6] ?? [],
    };
  }

  async actualizarBien(id: number, dto: ActualizarBienDto) {
    await this.verificarBienExiste(id);
    await ejecutarSql(() =>
      this.db.execute('SP_ActualizarBien', {
        IdBien: id,
        CodigoPatrimonial: dto.codigoPatrimonial ?? null,
        NumeroSerie: dto.numeroSerie ?? null,
        IdMarca: dto.idMarca ?? null,
        IdModelo: dto.idModelo ?? null,
        Descripcion: dto.descripcion ?? null,
        FechaIngreso: dto.fechaIngreso ?? null,
        AñoFabricacion: dto.anioFabricacion ?? null,
        ValorAdquisicion: dto.valorAdquisicion ?? null,
        Observaciones: dto.observaciones ?? null,
      }),
    );
    return { IdBien: id };
  }

  async cambiarEstado(id: number, dto: CambiarEstadoDto) {
    await this.verificarBienExiste(id);
    await ejecutarSql(() =>
      this.db.execute('SP_CambiarEstadoSeguro', {
        IdBien: id,
        IdNuevoEstado: dto.idEstadoNuevo,
        Motivo: dto.motivo ?? null,
      }),
    );
    return { IdBien: id };
  }

  async asignarResponsable(id: number, dto: AsignarResponsableDto) {
    await this.verificarBienExiste(id);
    await ejecutarSql(() =>
      this.db.execute('SP_AsignarBienSeguro', {
        IdBien: id,
        IdBombero: dto.idBombero,
        Motivo: dto.motivo ?? null,
      }),
    );
    return { IdBien: id };
  }

  async cambiarUbicacion(id: number, dto: CambiarUbicacionDto, idUsuario: number) {
    await this.verificarBienExiste(id);
    await ejecutarSql(() =>
      this.db.execute('SP_CambiarUbicacionBien', {
        IdBien: id,
        IdNuevaUbicacion: dto.idUbicacionNueva,
        IdUsuario: idUsuario,
        Motivo: dto.motivo ?? null,
      }),
    );
    return { IdBien: id };
  }

  async registrarQr(codigoInterno: string, contenidoQr: string) {
    const bien = await ejecutarSql(() =>
      this.db.queryOne<{ IdBien: number; CodigoInterno: string }>(
        'SELECT IdBien, CodigoInterno FROM dbo.TB_Bien WHERE CodigoInterno = @CodigoInterno;',
        { CodigoInterno: codigoInterno },
      ),
    );
    if (!bien) {
      throw new NotFoundException('El bien no existe.');
    }
    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarQRBien', {
        IdBien: bien.IdBien,
        CodigoQR: bien.CodigoInterno,
        ContenidoQR: contenidoQr,
      }),
    );
    return result.recordset?.[0] ?? { IdQR: null };
  }

  /** Genera el PNG del QR en memoria (no se guarda en BD ni en disco). */
  async generarPngQr(codigoInterno: string): Promise<Buffer> {
    const bien = await ejecutarSql(() =>
      this.db.queryOne<{ CodigoInterno: string }>(
        'SELECT CodigoInterno FROM dbo.TB_Bien WHERE CodigoInterno = @CodigoInterno;',
        { CodigoInterno: codigoInterno },
      ),
    );
    if (!bien) {
      throw new NotFoundException('El bien no existe.');
    }
    return QRCode.toBuffer(codigoInterno, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  }

  /* ------------------------------------------------------------------ */
  /* Catálogos                                                          */
  /* ------------------------------------------------------------------ */

  async catalogos(): Promise<Catalogos> {
    const result = await ejecutarSql(() => this.db.execute('SP_ListarCatalogos'));
    const recordsets = result.recordsets;
    return {
      marcas: recordsets[0] ?? [],
      modelos: recordsets[1] ?? [],
      estados: recordsets[2] ?? [],
      ubicaciones: recordsets[3] ?? [],
      tiposMovimiento: recordsets[4] ?? [],
    };
  }
}

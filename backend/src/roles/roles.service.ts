import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface FilaRol {
  IdRol: number;
  NombreRol: string;
  CantidadPermisos: number;
  CantidadUsuarios: number;
}

export interface FilaPermiso {
  IdPermiso: number;
  NombrePermiso: string;
  Modulo: string;
}

@Injectable()
export class RolesService {
  constructor(private readonly db: DatabaseService) {}

  /** Roles con cantidad de permisos y usuarios asignados. */
  async listar(): Promise<FilaRol[]> {
    return this.db.query<FilaRol>(`
      SELECT R.IdRol, R.NombreRol,
             (SELECT COUNT(*) FROM dbo.TB_RolPermiso RP WHERE RP.IdRol = R.IdRol) AS CantidadPermisos,
             (SELECT COUNT(*) FROM dbo.TB_UsuarioRol UR WHERE UR.IdRol = R.IdRol) AS CantidadUsuarios
      FROM dbo.TB_Rol R
      ORDER BY R.IdRol;
    `);
  }

  /** Permisos asignados a un rol. */
  async permisosDeRol(idRol: number): Promise<FilaPermiso[]> {
    await this.validarRol(idRol);
    return this.db.query<FilaPermiso>(
      `
      SELECT P.IdPermiso, P.NombrePermiso, P.Modulo
      FROM dbo.TB_RolPermiso RP
      JOIN dbo.TB_Permiso P ON P.IdPermiso = RP.IdPermiso
      WHERE RP.IdRol = @IdRol
      ORDER BY P.IdPermiso;
      `,
      { IdRol: idRol },
    );
  }

  /** Usuarios que pertenecen a un rol. */
  async usuariosDeRol(idRol: number) {
    await this.validarRol(idRol);
    return this.db.query(
      `
      SELECT U.IdUsuario, U.Usuario, U.Estado,
             B.IdBombero, B.CodigoBombero, B.Nombres, B.Apellidos
      FROM dbo.TB_UsuarioRol UR
      JOIN dbo.TB_Usuario U ON U.IdUsuario = UR.IdUsuario
      LEFT JOIN dbo.TB_Bombero B ON U.IdBombero = B.IdBombero
      WHERE UR.IdRol = @IdRol
      ORDER BY U.IdUsuario;
      `,
      { IdRol: idRol },
    );
  }

  /** Asigna permisos a un rol (lista completa: reemplaza los actuales). */
  async asignarPermisos(idRol: number, idPermisos: number[]): Promise<void> {
    await this.validarRol(idRol);
    await this.db.withTransaction(async (req) => {
      await req()
        .input('IdRol', idRol)
        .query('DELETE FROM dbo.TB_RolPermiso WHERE IdRol = @IdRol;');
      for (const idPermiso of idPermisos) {
        await req()
          .input('IdRol', idRol)
          .input('IdPermiso', idPermiso)
          .query(
            'INSERT INTO dbo.TB_RolPermiso (IdRol, IdPermiso) VALUES (@IdRol, @IdPermiso);',
          );
      }
    });
  }

  private async validarRol(idRol: number): Promise<void> {
    const filas = await this.db.query(
      'SELECT 1 AS Existe FROM dbo.TB_Rol WHERE IdRol = @IdRol;',
      { IdRol: idRol },
    );
    if (filas.length === 0) {
      throw new NotFoundException('El rol no existe.');
    }
  }
}

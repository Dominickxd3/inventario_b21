import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { ActualizarEstadoUsuarioDto } from './dto/actualizar-estado.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface FilaUsuario {
  IdUsuario: number;
  Usuario: string;
  Estado: number | boolean;
  UltimoAcceso: Date | null;
  FechaRegistro: Date;
  IdBombero: number | null;
  CodigoBombero: string | null;
  DNI: string | null;
  Nombres: string | null;
  Apellidos: string | null;
  Roles: string | null;
}

export interface FilaRol {
  IdRol: number;
  NombreRol: string;
}

export interface FilaPermiso {
  IdPermiso: number;
  NombrePermiso: string;
  Modulo: string;
}

export interface DetalleUsuario extends FilaUsuario {
  roles: FilaRol[];
  permisos: FilaPermiso[];
}

@Injectable()
export class UsuariosService {
  constructor(private readonly db: DatabaseService) {}

  /** Lista de usuarios con sus roles agregados (STRING_AGG no existe en 2016 -> FOR XML PATH). */
  async listar(): Promise<FilaUsuario[]> {
    const sqlTexto = `
      SELECT U.IdUsuario, U.Usuario, U.Estado, U.UltimoAcceso, U.FechaRegistro,
             B.IdBombero, B.CodigoBombero, B.DNI, B.Nombres, B.Apellidos,
             STUFF((
               SELECT ', ' + R2.NombreRol
               FROM dbo.TB_UsuarioRol UR2
               JOIN dbo.TB_Rol R2 ON R2.IdRol = UR2.IdRol
               WHERE UR2.IdUsuario = U.IdUsuario
               ORDER BY R2.NombreRol
               FOR XML PATH('')
             ), 1, 2, '') AS Roles
      FROM dbo.TB_Usuario U
      LEFT JOIN dbo.TB_Bombero B ON U.IdBombero = B.IdBombero
      ORDER BY U.IdUsuario;
    `;
    return this.db.query<FilaUsuario>(sqlTexto);
  }

  async detalle(idUsuario: number): Promise<DetalleUsuario> {
    const usuario = await this.db.queryOne<FilaUsuario>(
      `
      SELECT U.IdUsuario, U.Usuario, U.Estado, U.UltimoAcceso, U.FechaRegistro,
             B.IdBombero, B.CodigoBombero, B.DNI, B.Nombres, B.Apellidos
      FROM dbo.TB_Usuario U
      LEFT JOIN dbo.TB_Bombero B ON U.IdBombero = B.IdBombero
      WHERE U.IdUsuario = @IdUsuario;
      `,
      { IdUsuario: idUsuario },
    );

    if (!usuario) {
      throw new NotFoundException('El usuario no existe.');
    }

    const roles = await this.db.query<FilaRol>(
      `
      SELECT R.IdRol, R.NombreRol
      FROM dbo.TB_UsuarioRol UR
      JOIN dbo.TB_Rol R ON R.IdRol = UR.IdRol
      WHERE UR.IdUsuario = @IdUsuario
      ORDER BY R.IdRol;
      `,
      { IdUsuario: idUsuario },
    );

    const permisos = await this.permisosUsuario(idUsuario);

    return { ...usuario, roles, permisos };
  }

  /** Permisos efectivos del usuario (vía sus roles). */
  async permisosUsuario(idUsuario: number): Promise<FilaPermiso[]> {
    const permisos = await this.db.query<FilaPermiso>(
      `
      SELECT DISTINCT P.IdPermiso, P.NombrePermiso, P.Modulo
      FROM dbo.TB_UsuarioRol UR
      JOIN dbo.TB_RolPermiso RP ON RP.IdRol = UR.IdRol
      JOIN dbo.TB_Permiso P ON P.IdPermiso = RP.IdPermiso
      WHERE UR.IdUsuario = @IdUsuario
      ORDER BY P.IdPermiso;
      `,
      { IdUsuario: idUsuario },
    );

    const rolAdmin = await this.db.queryOne<FilaRol>(
      `
      SELECT R.IdRol, R.NombreRol
      FROM dbo.TB_UsuarioRol UR
      JOIN dbo.TB_Rol R ON R.IdRol = UR.IdRol
      WHERE UR.IdUsuario = @IdUsuario AND R.NombreRol = 'Administrador';
      `,
      { IdUsuario: idUsuario },
    );

    return rolAdmin
      ? this.db.query<FilaPermiso>(
          'SELECT IdPermiso, NombrePermiso, Modulo FROM dbo.TB_Permiso ORDER BY IdPermiso;',
        )
      : permisos;
  }

  /** Crea bombero (si aplica) + usuario + roles en una transacción. */
  async crear(dto: CrearUsuarioDto): Promise<{ idUsuario: number }> {
    const existe = await this.db.queryOne(
      'SELECT 1 AS Existe FROM dbo.TB_Usuario WHERE Usuario = @Usuario;',
      { Usuario: dto.usuario },
    );
    if (existe) {
      throw new BadRequestException('El nombre de usuario ya existe.');
    }

    const idUsuario = await this.db.withTransaction<number>(async (req) => {
      let idBombero = dto.idBombero ?? null;

      if (!idBombero) {
        if (!dto.dni || !dto.nombres || !dto.apellidos) {
          throw new BadRequestException(
            'Para crear el bombero debe enviar DNI, nombres y apellidos.',
          );
        }
        const rBombero = await req()
          .input('CodigoBombero', dto.codigoBombero ?? null)
          .input('DNI', dto.dni)
          .input('Nombres', dto.nombres)
          .input('Apellidos', dto.apellidos)
          .query(
            `INSERT INTO dbo.TB_Bombero (CodigoBombero, DNI, Nombres, Apellidos, FechaIngreso, Estado, FechaRegistro)
             VALUES (@CodigoBombero, @DNI, @Nombres, @Apellidos, GETDATE(), 1, GETDATE());
             SELECT SCOPE_IDENTITY() AS IdBombero;`,
          );
        idBombero = rBombero.recordset[0].IdBombero;
      }

      const hash = await bcrypt.hash(dto.password, 10);

      const rUsuario = await req()
        .input('IdBombero', idBombero)
        .input('Usuario', dto.usuario)
        .input('PasswordHash', hash)
        .query(
          `INSERT INTO dbo.TB_Usuario (IdBombero, Usuario, PasswordHash, Estado, FechaRegistro)
           VALUES (@IdBombero, @Usuario, @PasswordHash, 1, GETDATE());
           SELECT SCOPE_IDENTITY() AS IdUsuario;`,
        );
      const nuevoId = rUsuario.recordset[0].IdUsuario as number;

      const roles = dto.roles?.length ? dto.roles : [5]; // por defecto: Consulta
      for (const idRol of roles) {
        await req()
          .input('IdUsuario', nuevoId)
          .input('IdRol', idRol)
          .query(
            'INSERT INTO dbo.TB_UsuarioRol (IdUsuario, IdRol) VALUES (@IdUsuario, @IdRol);',
          );
      }

      return nuevoId;
    });

    return { idUsuario };
  }

  async cambiarEstado(
    idUsuario: number,
    dto: ActualizarEstadoUsuarioDto,
  ): Promise<void> {
    const filas = await this.db.query(
      'SELECT 1 AS Existe FROM dbo.TB_Usuario WHERE IdUsuario = @IdUsuario;',
      { IdUsuario: idUsuario },
    );
    if (filas.length === 0) {
      throw new NotFoundException('El usuario no existe.');
    }
    await this.db.query(
      'UPDATE dbo.TB_Usuario SET Estado = @Estado WHERE IdUsuario = @IdUsuario;',
      { IdUsuario: idUsuario, Estado: dto.estado ? 1 : 0 },
    );
  }

  async resetPassword(
    idUsuario: number,
    dto: ResetPasswordDto,
  ): Promise<void> {
    const filas = await this.db.query(
      'SELECT 1 AS Existe FROM dbo.TB_Usuario WHERE IdUsuario = @IdUsuario;',
      { IdUsuario: idUsuario },
    );
    if (filas.length === 0) {
      throw new NotFoundException('El usuario no existe.');
    }
    const hash = await bcrypt.hash(dto.nuevaPassword, 10);
    await this.db.query(
      'UPDATE dbo.TB_Usuario SET PasswordHash = @PasswordHash WHERE IdUsuario = @IdUsuario;',
      { IdUsuario: idUsuario, PasswordHash: hash },
    );
  }
}

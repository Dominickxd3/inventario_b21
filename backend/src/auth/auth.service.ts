import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as sql from 'mssql';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';

interface FilaLogin {
  IdUsuario: number;
  Usuario: string;
  PasswordHash: string;
  Estado: number | boolean;
  IdBombero: number | null;
  CodigoBombero: string | null;
  Nombres: string | null;
  Apellidos: string | null;
  IdRol: number | null;
  NombreRol: string | null;
  IdPermiso: number | null;
  NombrePermiso: string | null;
  Modulo: string | null;
}

export interface RespuestaLogin {
  token: string;
  idUsuario: number;
  idSesion: number;
  usuario: string;
  nombreCompleto: string;
  codigoBombero: string | null;
  rol: string | null;
  roles: string[];
  permisos: string[];
  esAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Login:
   *  1. SP_ObtenerUsuarioLogin devuelve datos + hash + roles + permisos.
   *  2. bcrypt.compare en el backend (NUNCA en texto plano en SQL).
   *  3. Registra sesión (TB_SesionUsuario) y log (TB_LogAccesoWeb).
   *  4. Genera JWT con roles y permisos.
   */
  async login(
    dto: LoginDto,
    ip?: string,
    navegador?: string,
  ): Promise<RespuestaLogin> {
    const { recordset } = await this.db.execute<FilaLogin>(
      'SP_ObtenerUsuarioLogin',
      { Usuario: dto.usuario },
    );

    if (recordset.length === 0) {
      await this.registrarLog(null, ip, navegador, 'LOGIN_FALLIDO');
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const fila = recordset[0];

    const passwordValida = await bcrypt.compare(
      dto.password,
      fila.PasswordHash,
    );
    if (!passwordValida) {
      await this.registrarLog(fila.IdUsuario, ip, navegador, 'LOGIN_FALLIDO');
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    if (fila.Estado !== true && fila.Estado !== 1) {
      await this.registrarLog(fila.IdUsuario, ip, navegador, 'LOGIN_BLOQUEADO');
      throw new UnauthorizedException('El usuario se encuentra inactivo.');
    }

    const roles = this.unicos(recordset.map((r) => r.NombreRol));
    const permisos = this.unicos(recordset.map((r) => r.NombrePermiso));
    const esAdmin = roles.includes('Administrador');

    // Registra sesión activa
    const { output } = await this.db.executeOutput(
      'SP_RegistrarSesion',
      { IdUsuario: fila.IdUsuario, IP: ip ?? null },
      { IdSesion: sql.Int },
    );

    await this.registrarLog(fila.IdUsuario, ip, navegador, 'LOGIN');

    const token = this.jwtService.sign({
      sub: fila.IdUsuario,
      usuario: fila.Usuario,
      roles,
      permisos,
      esAdmin,
    });

    const nombreCompleto = [fila.Nombres, fila.Apellidos]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      token,
      idUsuario: fila.IdUsuario,
      idSesion: output.IdSesion,
      usuario: fila.Usuario,
      nombreCompleto,
      codigoBombero: fila.CodigoBombero,
      rol: roles[0] ?? null,
      roles,
      permisos,
      esAdmin,
    };
  }

  async cerrarSesion(idSesion: number): Promise<void> {
    await this.db.execute('SP_CerrarSesion', { IdSesion: idSesion });
  }

  private async registrarLog(
    idUsuario: number | null,
    ip?: string,
    navegador?: string,
    accion: string = 'ACCESO',
  ): Promise<void> {
    try {
      await this.db.execute('SP_RegistrarAccesoWeb', {
        IdUsuario: idUsuario,
        IP: ip ?? null,
        Navegador: navegador ?? null,
        Accion: accion,
      });
    } catch {
      // El log no debe impedir el login
    }
  }

  private unicos(valores: (string | null)[]): string[] {
    return [...new Set(valores.filter((v): v is string => Boolean(v)))];
  }
}

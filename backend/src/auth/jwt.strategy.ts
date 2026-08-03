import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioAutenticado } from '../common/decorators/usuario-actual.decorator';

export interface JwtPayload {
  sub: number;
  usuario: string;
  roles: string[];
  permisos: string[];
  esAdmin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'secret',
    });
  }

  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token inválido.');
    }
    return {
      idUsuario: payload.sub,
      usuario: payload.usuario,
      roles: payload.roles ?? [],
      permisos: payload.permisos ?? [],
    };
  }
}

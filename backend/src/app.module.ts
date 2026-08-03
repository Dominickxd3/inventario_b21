import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermisosGuard } from './auth/guards/permisos.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { InventarioModule } from './inventario/inventario.module';
import { MantenimientoModule } from './mantenimiento/mantenimiento.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsuariosModule,
    RolesModule,
    InventarioModule,
    MovimientosModule,
    MantenimientoModule,
  ],
  providers: [
    // Guards globales: JWT -> Roles -> Permisos
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermisosGuard },
  ],
})
export class AppModule {}

import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { sqlServerProvider, SQL_CONNECTION } from './sqlserver.provider';

/**
 * Módulo global de base de datos.
 * Expone el pool (SQL_CONNECTION) y el DatabaseService en toda la aplicación.
 */
@Global()
@Module({
  providers: [sqlServerProvider, DatabaseService],
  exports: [SQL_CONNECTION, DatabaseService],
})
export class DatabaseModule {}

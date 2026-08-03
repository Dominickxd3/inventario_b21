import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

/**
 * Token de inyección para el pool de conexiones de SQL Server.
 */
export const SQL_CONNECTION = 'SQL_CONNECTION';

/**
 * Proveedor global de la conexión a SQL Server.
 * Pool reutilizable (mssql), configurado desde variables de entorno.
 * NO se usa ORM: toda la comunicación es mediante procedimientos
 * almacenados y consultas SQL controladas.
 */
export const sqlServerProvider: Provider = {
  provide: SQL_CONNECTION,
  inject: [ConfigService],
  useFactory: async (config: ConfigService): Promise<sql.ConnectionPool> => {
    const pool = new sql.ConnectionPool({
      server: config.get<string>('DB_SERVER') ?? 'localhost',
      port: parseInt(config.get<string>('DB_PORT') ?? '1433', 10),
      database: config.get<string>('DB_NAME') ?? 'BD_Inventario_B21',
      user: config.get<string>('DB_USER'),
      password: config.get<string>('DB_PASSWORD'),
      options: {
        encrypt: config.get<string>('DB_ENCRYPT') === 'true',
        trustServerCertificate:
          config.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
        enableArithAbort: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 20000,
      },
    });

    await pool.connect();
    return pool;
  },
};

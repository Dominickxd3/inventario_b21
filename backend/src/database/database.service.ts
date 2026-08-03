import { Inject, Injectable } from '@nestjs/common';
import {
  ConnectionPool,
  IResult,
  ISqlType,
  Request,
  Transaction,
} from 'mssql';
import { SQL_CONNECTION } from './sqlserver.provider';

export interface ResultadoConOutput<T> {
  result: IResult<T>;
  output: Record<string, any>;
}

/**
 * Servicio de acceso a datos sobre SQL Server.
 *
 * - execute:      ejecuta un procedimiento almacenado.
 * - executeOutput: ejecuta un SP y devuelve parámetros OUTPUT.
 * - query:        ejecuta una consulta SQL controlada (parametrizada).
 * - withTransaction: ejecuta un bloque de operaciones en una transacción.
 *
 * Todos los parámetros se envían SIEMPRE parametrizados (protección
 * contra inyección SQL).
 */
@Injectable()
export class DatabaseService {
  constructor(@Inject(SQL_CONNECTION) private readonly pool: ConnectionPool) {}

  private bindInputs(request: Request, params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value === undefined ? null : value);
    }
  }

  async execute<T = any>(
    procedure: string,
    params: Record<string, any> = {},
  ): Promise<IResult<T>> {
    const request = this.pool.request();
    this.bindInputs(request, params);
    return request.execute(procedure);
  }

  async executeOutput<T = any>(
    procedure: string,
    params: Record<string, any> = {},
    outputs: Record<string, ISqlType> = {},
  ): Promise<ResultadoConOutput<T>> {
    const request = this.pool.request();
    this.bindInputs(request, params);
    for (const [key, type] of Object.entries(outputs)) {
      request.output(key, type);
    }
    const result = await request.execute(procedure);
    return { result, output: result.output };
  }

  async query<T = any>(
    sqlText: string,
    params: Record<string, any> = {},
  ): Promise<T[]> {
    const request = this.pool.request();
    this.bindInputs(request, params);
    const result = await request.query(sqlText);
    return result.recordset as T[];
  }

  async queryOne<T = any>(
    sqlText: string,
    params: Record<string, any> = {},
  ): Promise<T | undefined> {
    const rows = await this.query<T>(sqlText, params);
    return rows[0];
  }

  /**
   * Ejecuta un bloque de operaciones dentro de una transacción.
   * `req()` devuelve un Request vinculado a la transacción.
   */
  async withTransaction<T>(
    fn: (req: () => Request) => Promise<T>,
  ): Promise<T> {
    const transaction = new Transaction(this.pool);
    await transaction.begin();
    try {
      const makeRequest = () => transaction.request();
      const result = await fn(makeRequest);
      await transaction.commit();
      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        /* rollback ya ejecutado o conexión caída */
      }
      throw error;
    }
  }
}

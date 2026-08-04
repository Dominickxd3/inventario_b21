export interface UsuarioAutenticado {
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

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface Bien {
  IdBien: number;
  CodigoInterno: string;
  CodigoPatrimonial: string | null;
  NumeroSerie: string | null;
  IdArticulo: number;
  CodigoArticulo: string | null;
  NombreArticulo: string;
  TipoControl: string | null;
  Descripcion: string | null;
  IdMarca: number | null;
  NombreMarca: string | null;
  IdModelo: number | null;
  NombreModelo: string | null;
  IdEstado: number;
  NombreEstado: string;
  IdUbicacion: number | null;
  NombreUbicacion: string | null;
  IdResponsableActual: number | null;
  Responsable: string | null;
  CodigoBombero: string | null;
  FechaIngreso: string | null;
  Observaciones: string | null;
  Eliminado: boolean | null;
}

export interface ListadoPaginado<T> {
  data: T[];
  total: number;
}

export interface RegistroHistorial {
  Fecha?: string;
  FechaMovimiento?: string;
  FechaAsignacion?: string;
  CodigoMovimiento?: string;
  NombreMovimiento?: string;
  Detalle?: string;
  Observacion?: string;
  Motivo?: string;
  EstadoAntes?: string;
  EstadoDespues?: string;
  NombreEstado?: string;
  ResponsableAntes?: string;
  ResponsableDespues?: string;
  Bombero?: string;
  Usuario?: string;
  TipoDocumento?: string;
  NombreArchivoOriginal?: string;
  RutaArchivo?: string;
  IdArchivoGoogleDrive?: string;
  [clave: string]: unknown;
}

export interface FichaBien {
  bien: Bien;
  relacion: RegistroHistorial[];
  historialEstado: RegistroHistorial[];
  historialAsignacion: RegistroHistorial[];
  kardex: RegistroHistorial[];
  fotos: RegistroHistorial[];
  qr: RegistroHistorial[];
  documentos?: RegistroHistorial[];
}

export interface Articulo {
  IdArticulo: number;
  CodigoArticulo: string;
  NombreArticulo: string;
  Descripcion: string | null;
  TipoControl: string;
  Estado: boolean;
  FechaRegistro: string;
  CantidadBienes: number;
}

export interface Movimiento {
  IdMovimiento: number;
  CodigoMovimiento: string;
  NombreMovimiento: string;
  FechaMovimiento: string;
  IdUsuario: number | null;
  Usuario: string | null;
  CodigoInterno: string | null;
  NombreArticulo: string | null;
  Observacion: string | null;
  Estado: string | null;
  EstadoAnterior: string | null;
  EstadoNuevo: string | null;
}

export interface Prestamo {
  IdPrestamo: number;
  CodigoPrestamo: string;
  CodigoInterno: string | null;
  NombreArticulo: string | null;
  Solicitante: string | null;
  Autoriza: string | null;
  FechaSalida: string;
  FechaDevolucionProgramada: string | null;
  FechaDevolucionReal: string | null;
  Estado: string;
  Observacion: string | null;
}

export interface Mantenimiento {
  IdMantenimiento: number;
  CodigoInterno: string;
  NombreArticulo: string;
  TipoMantenimiento: string;
  FechaInicio: string | null;
  FechaFin: string | null;
  Diagnostico: string | null;
  TrabajoRealizado: string | null;
  Costo: number | null;
  Estado: string;
  Responsable: string | null;
}

export interface DashboardResumen {
  TotalBienes: number;
  Operativos: number;
  Averiados: number;
  EnMantenimiento: number;
  Prestados: number;
  DadosBaja: number;
  NoLocalizados: number;
  EnEvaluacion: number;
}

export interface DashboardData {
  resumen: DashboardResumen;
  estados: { IdEstado: number; NombreEstado: string; Cantidad: number }[];
  movimientosPorMes: { Anio: number; Mes: number; CantidadMovimientos: number }[];
  mantenimientosPorMes: {
    Anio: number;
    Mes: number;
    CantidadMantenimientos: number;
    CostoTotal: number;
    CostoRepuestos: number;
  }[];
}

export interface Catalogos {
  marcas: { IdMarca: number; NombreMarca: string }[];
  modelos: { IdModelo: number; NombreModelo: string; IdMarca: number; NombreMarca: string }[];
  estados: { IdEstado: number; NombreEstado: string }[];
  ubicaciones: {
    IdUbicacion: number;
    NombreUbicacion: string;
    TipoUbicacion: string | null;
    IdUbicacionPadre: number | null;
  }[];
  tiposMovimiento: { IdTipoMovimiento: number; NombreMovimiento: string }[];
}
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { drive_v3, google } from 'googleapis';

export interface ArchivoDrive {
  idArchivoGoogleDrive: string;
  rutaGoogleDrive: string;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly RAIZ = 'B21_INVENTARIO';
  private drive: drive_v3.Drive | null = null;
  private readonly cacheCarpetas = new Map<string, string>();

  constructor() {
    const rutaCredenciales = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT;
    if (rutaCredenciales) {
      try {
        const auth = new google.auth.GoogleAuth({
          keyFile: rutaCredenciales,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        this.drive = google.drive({ version: 'v3', auth });
        this.logger.log('Google Drive inicializado en modo REAL.');
      } catch (error) {
        this.logger.error(
          `No se pudo inicializar Google Drive: ${(error as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        'GOOGLE_DRIVE_SERVICE_ACCOUNT no definido. Google Drive en modo SIMULADO.',
      );
    }
  }

  private generarIdSimulado(carpeta: string): string {
    const prefijo = carpeta === 'Fotos' ? 'DRV-F' : 'DRV-D';
    const sufijo =
      Date.now().toString(36).toUpperCase() +
      '-' +
      Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefijo}-${sufijo}`;
  }

  async subir(
    bienCodigo: string,
    carpeta: 'Fotos' | 'Documentos',
    nombreArchivo: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<ArchivoDrive> {
    if (!this.drive) {
      if (process.env.DRIVE_MODO === 'REAL') {
        throw new ServiceUnavailableException(
          'Google Drive no está configurado en el servidor.',
        );
      }
      const id = this.generarIdSimulado(carpeta);
      this.logger.warn(
        `[SIMULADO] Subida de "${nombreArchivo}" a ${this.RAIZ}/${bienCodigo}/${carpeta} -> ${id}`,
      );
      return {
        idArchivoGoogleDrive: id,
        rutaGoogleDrive: `https://drive.google.com/file/d/${id}/view`,
      };
    }

    const raizId = await this.obtenerOCrearCarpeta(this.RAIZ);
    const bienId = await this.obtenerOCrearCarpeta(bienCodigo, raizId);
    const carpetaId = await this.obtenerOCrearCarpeta(carpeta, bienId);

    const res = await this.drive.files.create({
      requestBody: { name: nombreArchivo, parents: [carpetaId] },
      media: { mimeType, body: buffer },
      fields: 'id, webViewLink',
    });

    return {
      idArchivoGoogleDrive: res.data.id ?? '',
      rutaGoogleDrive:
        res.data.webViewLink ??
        `https://drive.google.com/file/d/${res.data.id}/view`,
    };
  }

  private async obtenerOCrearCarpeta(
    nombre: string,
    padre?: string,
  ): Promise<string> {
    const clave = padre ? `${padre}/${nombre}` : nombre;
    const cacheado = this.cacheCarpetas.get(clave);
    if (cacheado) {
      return cacheado;
    }

    const drive = this.drive!;
    const query = padre
      ? `name = '${nombre.replace(/'/g, "\\'")}' and '${padre}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      : `name = '${nombre.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    const lista = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 1,
    });

    let id = lista.data.files?.[0]?.id;

    if (!id) {
      const creada = await drive.files.create({
        requestBody: {
          name: nombre,
          mimeType: 'application/vnd.google-apps.folder',
          ...(padre ? { parents: [padre] } : {}),
        },
        fields: 'id',
      });
      id = creada.data.id ?? '';
    }

    this.cacheCarpetas.set(clave, id);
    return id;
  }
}

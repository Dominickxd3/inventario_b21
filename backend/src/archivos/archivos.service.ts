import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ejecutarSql } from '../common/sql-error.translator';
import { DatabaseService } from '../database/database.service';
import { SubirDocumentoDto } from './dto/subir-documento.dto';
import { SubirFotoDto } from './dto/subir-foto.dto';
import { GoogleDriveService } from './google-drive.service';
import { ArchivoRecibido, ImageService } from './image.service';

const EXTENSIONES_DOCUMENTO = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

function nombreUnico(nombreOriginal: string): string {
  const limpio = (nombreOriginal ?? 'archivo').replace(/[\\/:*?"<>|]/g, '_');
  return `${Date.now()}-${limpio}`;
}

@Injectable()
export class ArchivosService {
  constructor(
    private readonly db: DatabaseService,
    private readonly drive: GoogleDriveService,
    private readonly imagenes: ImageService,
  ) {}

  async subirFoto(
    idBien: number,
    archivo: ArchivoRecibido | undefined,
    dto: SubirFotoDto,
    idUsuario: number,
  ) {
    if (!archivo) {
      throw new BadRequestException('Debe enviar un archivo de imagen.');
    }
    if (!archivo.mimetype || !archivo.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen (JPG/PNG).');
    }

    const codigoBien = await this.obtenerCodigoBien(idBien);
    const procesada = await this.imagenes.procesar(archivo);
    const subida = await this.drive.subir(
      codigoBien,
      'Fotos',
      nombreUnico(archivo.originalname),
      'image/jpeg',
      procesada.buffer,
    );

    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarFotoBien', {
        IdBien: idBien,
        NombreArchivo: nombreUnico(archivo.originalname),
        TipoFoto: dto.tipoFoto ?? 'Vista general',
        RutaGoogleDrive: subida.rutaGoogleDrive,
        IdArchivoGoogleDrive: subida.idArchivoGoogleDrive,
        Extension: procesada.extension,
        TamanoKB: procesada.tamanoComprimidoKB,
        Descripcion: dto.descripcion ?? null,
        IdUsuario: idUsuario,
        TamanoOriginalKB: procesada.tamanoOriginalKB,
        TamanoComprimidoKB: procesada.tamanoComprimidoKB,
        ResolucionOriginal: procesada.resolucionOriginal,
        ResolucionFinal: procesada.resolucionFinal,
        CalidadCompresion: procesada.calidadCompresion,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  async listarFotos(idBien: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarFotosBien', { IdBien: idBien }),
    );
    return result.recordset ?? [];
  }

  async eliminarFoto(idFoto: number, idUsuario: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_CambiarEstadoFoto', {
        IdFoto: idFoto,
        Estado: 0,
        IdUsuario: idUsuario,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  async subirDocumento(
    idBien: number,
    archivo: ArchivoRecibido | undefined,
    dto: SubirDocumentoDto,
    idUsuario: number,
  ) {
    if (!archivo) {
      throw new BadRequestException('Debe enviar un archivo.');
    }
    const extension = (archivo.originalname.split('.').pop() ?? '').toLowerCase();
    if (!EXTENSIONES_DOCUMENTO.includes(extension)) {
      throw new BadRequestException(
        'Formato no permitido. Solo se aceptan PDF, DOC, DOCX, XLS o XLSX.',
      );
    }
    if (archivo.size > 15 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el límite de 15 MB.');
    }

    const codigoBien = await this.obtenerCodigoBien(idBien);
    const nombre = nombreUnico(archivo.originalname);
    const subida = await this.drive.subir(
      codigoBien,
      'Documentos',
      nombre,
      archivo.mimetype ?? 'application/octet-stream',
      archivo.buffer,
    );

    const result = await ejecutarSql(() =>
      this.db.execute('SP_RegistrarDocumentoBien', {
        CodigoDocumento: dto.codigo,
        IdBien: idBien,
        TipoDocumento: dto.tipoDocumento,
        RutaArchivo: subida.rutaGoogleDrive,
        IdArchivoGoogleDrive: subida.idArchivoGoogleDrive,
        NombreArchivoOriginal: archivo.originalname,
        TamanoKB: Math.round(archivo.size / 1024),
        Extension: extension,
        IdUsuario: idUsuario,
      }),
    );
    return result.recordset?.[0] ?? null;
  }

  async listarDocumentos(idBien: number) {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarDocumentosBien', { IdBien: idBien }),
    );
    return result.recordset ?? [];
  }

  async listarTiposDocumento() {
    const result = await ejecutarSql(() =>
      this.db.execute('SP_ListarTiposDocumento', {}),
    );
    return result.recordset ?? [];
  }

  private async obtenerCodigoBien(idBien: number): Promise<string> {
    const fila = await this.db.queryOne<{ CodigoInterno: string }>(
      `SELECT CodigoInterno
         FROM dbo.TB_Bien
        WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0`,
      { IdBien: idBien },
    );
    if (!fila) {
      throw new NotFoundException('El bien no existe o está eliminado.');
    }
    return fila.CodigoInterno;
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import type { Metadata } from 'sharp';

export interface ArchivoRecibido {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ImagenProcesada {
  buffer: Buffer;
  extension: string;
  tamanoOriginalKB: number;
  tamanoComprimidoKB: number;
  resolucionOriginal: string;
  resolucionFinal: string;
  calidadCompresion: number;
}

/**
 * Procesa imagenes con Sharp:
 *  - valida que el archivo sea una imagen real (rechaza corruptos/falsos),
 *  - limita el tamano original a 5 MB,
 *  - redimensiona a maximo 1600px (sin ampliar) y comprime a JPEG calidad 78.
 */
@Injectable()
export class ImageService {
  private readonly MAX_ORIGINAL_KB = 5120;
  private readonly ANCHO_MAX = 1600;
  private readonly CALIDAD = 78;

  async procesar(archivo: ArchivoRecibido): Promise<ImagenProcesada> {
    if (!archivo || !archivo.buffer || archivo.buffer.length === 0) {
      throw new BadRequestException('Debe enviar un archivo de imagen.');
    }
    if (archivo.size > this.MAX_ORIGINAL_KB * 1024) {
      throw new BadRequestException(
        `La imagen supera el límite de ${this.MAX_ORIGINAL_KB / 1024} MB.`,
      );
    }

    let metadata: Metadata;
    try {
      metadata = await sharp(archivo.buffer).metadata();
    } catch {
      throw new BadRequestException('El archivo no es una imagen válida.');
    }

    const resolucionOriginal = `${metadata.width ?? 0}x${metadata.height ?? 0}`;

    let bufferFinal: Buffer;
    try {
      bufferFinal = await sharp(archivo.buffer)
        .rotate()
        .resize({
          width: this.ANCHO_MAX,
          height: this.ANCHO_MAX,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: this.CALIDAD })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'No se pudo procesar la imagen (formato no soportado).',
      );
    }

    const metaFinal = await sharp(bufferFinal).metadata();

    return {
      buffer: bufferFinal,
      extension: 'jpg',
      tamanoOriginalKB: Math.round(archivo.size / 1024),
      tamanoComprimidoKB: Math.round(bufferFinal.length / 1024),
      resolucionOriginal,
      resolucionFinal: `${metaFinal.width ?? 0}x${metaFinal.height ?? 0}`,
      calidadCompresion: this.CALIDAD,
    };
  }
}

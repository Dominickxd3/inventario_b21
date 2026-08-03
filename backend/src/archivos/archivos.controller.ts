import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permisos } from '../common/decorators/permisos.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { ArchivosService } from './archivos.service';
import { SubirDocumentoDto } from './dto/subir-documento.dto';
import { SubirFotoDto } from './dto/subir-foto.dto';

@Controller()
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  @Post('bienes/:id/fotos')
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { files: 1, fileSize: 6 * 1024 * 1024 } }),
  )
  @Permisos('Editar bienes')
  subirFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() archivo: Express.Multer.File,
    @Body() dto: SubirFotoDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.archivosService.subirFoto(id, archivo, dto, idUsuario);
  }

  @Get('bienes/:id/fotos')
  @Permisos('Consultar inventario')
  listarFotos(@Param('id', ParseIntPipe) id: number) {
    return this.archivosService.listarFotos(id);
  }

  @Delete('fotos/:id')
  @Permisos('Editar bienes')
  eliminarFoto(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.archivosService.eliminarFoto(id, idUsuario);
  }

  @Post('bienes/:id/documentos')
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { files: 1, fileSize: 15 * 1024 * 1024 },
    }),
  )
  @Permisos('Editar bienes')
  subirDocumento(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() archivo: Express.Multer.File,
    @Body() dto: SubirDocumentoDto,
    @UsuarioActual('idUsuario') idUsuario: number,
  ) {
    return this.archivosService.subirDocumento(id, archivo, dto, idUsuario);
  }

  @Get('bienes/:id/documentos')
  @Permisos('Consultar inventario')
  listarDocumentos(@Param('id', ParseIntPipe) id: number) {
    return this.archivosService.listarDocumentos(id);
  }

  @Get('documentos/tipos')
  @Permisos('Consultar inventario')
  listarTiposDocumento() {
    return this.archivosService.listarTiposDocumento();
  }
}

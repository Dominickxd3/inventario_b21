import { Module } from '@nestjs/common';
import { ArchivosController } from './archivos.controller';
import { ArchivosService } from './archivos.service';
import { GoogleDriveService } from './google-drive.service';
import { ImageService } from './image.service';

@Module({
  controllers: [ArchivosController],
  providers: [ArchivosService, GoogleDriveService, ImageService],
  exports: [ArchivosService],
})
export class ArchivosModule {}

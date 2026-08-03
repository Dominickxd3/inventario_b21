/* ============================================================================
   FASE 5 - FOTOS / DOCUMENTOS / GOOGLE DRIVE (BD_Inventario_B21)
   ----------------------------------------------------------------------------
   Cambios:
     1) TB_Documento            : + columnas Drive/nombre/tamano/estado (aprobado).
     2) TB_TipoDocumento        : + CERTIFICADO (CERT) y OTRO (OTR) (aprobado).
     3) SP_RegistrarFotoBien    : registra metadatos de foto (Drive + compresion).
     4) SP_ListarFotosBien      : lista fotos activas de un bien.
     5) SP_RegistrarDocumentoBien: registra metadatos de documento.
     6) SP_ListarDocumentosBien : lista documentos activos de un bien.
     7) SP_CambiarEstadoFoto    : soft-delete (Estado=0), nunca borra fisicamente.
     8) SP_ListarTiposDocumento : catalogo.

   Reglas:
     - SQL SOLO guarda metadatos (nunca binarios).
     - Fotos: Estado=1 activa; DELETE logico mantiene historial.
     - RAISERROR compatibles con traductor SQL->HTTP compartido.
   ============================================================================ */

USE BD_Inventario_B21;
GO

/* ---------------------------------------------------------------------------
   1) TB_DOCUMENTO - COLUMNAS ADITIVAS (aprobadas)
   --------------------------------------------------------------------------- */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TB_Documento') AND name = 'IdArchivoGoogleDrive'
)
BEGIN
    ALTER TABLE dbo.TB_Documento ADD IdArchivoGoogleDrive VARCHAR(200) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TB_Documento') AND name = 'NombreArchivoOriginal'
)
BEGIN
    ALTER TABLE dbo.TB_Documento ADD NombreArchivoOriginal VARCHAR(255) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TB_Documento') AND name = 'TamanoKB'
)
BEGIN
    ALTER TABLE dbo.TB_Documento ADD TamanoKB INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TB_Documento') AND name = 'Extension'
)
BEGIN
    ALTER TABLE dbo.TB_Documento ADD Extension VARCHAR(10) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TB_Documento') AND name = 'Estado'
)
BEGIN
    ALTER TABLE dbo.TB_Documento ADD Estado BIT NOT NULL CONSTRAINT DF_Documento_Estado DEFAULT (1);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TB_Documento') AND name = 'FechaCarga'
)
BEGIN
    ALTER TABLE dbo.TB_Documento ADD FechaCarga DATETIME NULL;
END
GO

/* ---------------------------------------------------------------------------
   2) TB_TIPODOCUMENTO - CERTIFICADO y OTRO (aprobado)
   --------------------------------------------------------------------------- */
IF NOT EXISTS (
    SELECT 1 FROM dbo.TB_TipoDocumento WHERE CodigoDocumento = 'CERT'
)
BEGIN
    INSERT INTO dbo.TB_TipoDocumento (NombreDocumento, CodigoDocumento)
    VALUES ('Certificado', 'CERT');
END
GO

IF NOT EXISTS (
    SELECT 1 FROM dbo.TB_TipoDocumento WHERE CodigoDocumento = 'OTR'
)
BEGIN
    INSERT INTO dbo.TB_TipoDocumento (NombreDocumento, CodigoDocumento)
    VALUES ('Otro', 'OTR');
END
GO

/* ===========================================================================
   3) SP_REGISTRARFOTOBIEN
   Metadatos de fotografia subida a Google Drive (o modo simulado).
   =========================================================================== */
IF OBJECT_ID('dbo.SP_RegistrarFotoBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarFotoBien;
GO

CREATE PROCEDURE dbo.SP_RegistrarFotoBien
    @IdBien               INT,
    @NombreArchivo        VARCHAR(255),
    @TipoFoto             VARCHAR(50),
    @RutaGoogleDrive      VARCHAR(500),
    @IdArchivoGoogleDrive VARCHAR(200),
    @Extension            VARCHAR(10),
    @TamanoKB             INT,
    @Descripcion          VARCHAR(300) = NULL,
    @IdUsuario            INT,
    @TamanoOriginalKB     INT = NULL,
    @TamanoComprimidoKB   INT = NULL,
    @ResolucionOriginal   VARCHAR(50) = NULL,
    @ResolucionFinal      VARCHAR(50) = NULL,
    @CalidadCompresion    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdFoto INT;

    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM dbo.TB_Bien
            WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0
        )
        BEGIN
            RAISERROR('El bien no existe o está eliminado.', 16, 1);
            RETURN;
        END

        INSERT INTO dbo.TB_FotoBien
            (IdBien, NombreArchivo, TipoFoto, RutaGoogleDrive,
             IdArchivoGoogleDrive, Extension, TamanoKB, Descripcion,
             FechaCarga, UsuarioCarga, Estado,
             TamanoOriginalKB, TamanoComprimidoKB,
             ResolucionOriginal, ResolucionFinal, CalidadCompresion)
        VALUES
            (@IdBien, @NombreArchivo, @TipoFoto, @RutaGoogleDrive,
             @IdArchivoGoogleDrive, @Extension, @TamanoKB, @Descripcion,
             GETDATE(), @IdUsuario, 1,
             @TamanoOriginalKB, @TamanoComprimidoKB,
             @ResolucionOriginal, @ResolucionFinal, @CalidadCompresion);

        SET @IdFoto = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT IdFoto = @IdFoto, IdBien = @IdBien, NombreArchivo = @NombreArchivo,
           IdArchivoGoogleDrive = @IdArchivoGoogleDrive, Estado = 1;
END
GO

/* ===========================================================================
   4) SP_LISTARFOTOSBIEN
   =========================================================================== */
IF OBJECT_ID('dbo.SP_ListarFotosBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarFotosBien;
GO

CREATE PROCEDURE dbo.SP_ListarFotosBien
    @IdBien INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT IdFoto, IdBien, NombreArchivo, TipoFoto, RutaGoogleDrive,
           IdArchivoGoogleDrive, Extension, TamanoKB, Descripcion,
           FechaCarga, UsuarioCarga, Estado,
           TamanoOriginalKB, TamanoComprimidoKB,
           ResolucionOriginal, ResolucionFinal, CalidadCompresion
    FROM dbo.TB_FotoBien
    WHERE IdBien = @IdBien AND Estado = 1
    ORDER BY FechaCarga DESC, IdFoto DESC;
END
GO

/* ===========================================================================
   5) SP_REGISTRARDOCUMENTOBIEN
   Metadatos de documento (PDF/DOCX/XLSX) asociado a un bien.
   CodigoDocumento unico (409 si duplicado).
   =========================================================================== */
IF OBJECT_ID('dbo.SP_RegistrarDocumentoBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarDocumentoBien;
GO

CREATE PROCEDURE dbo.SP_RegistrarDocumentoBien
    @CodigoDocumento      VARCHAR(30),
    @IdBien               INT,
    @TipoDocumento        VARCHAR(50),
    @RutaArchivo          VARCHAR(500),
    @IdArchivoGoogleDrive VARCHAR(200) = NULL,
    @NombreArchivoOriginal VARCHAR(255) = NULL,
    @TamanoKB             INT = NULL,
    @Extension            VARCHAR(10) = NULL,
    @IdUsuario            INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdDocumento INT;

    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM dbo.TB_Bien
            WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0
        )
        BEGIN
            RAISERROR('El bien no existe o está eliminado.', 16, 1);
            RETURN;
        END

        IF EXISTS (
            SELECT 1 FROM dbo.TB_Documento WHERE CodigoDocumento = @CodigoDocumento
        )
        BEGIN
            RAISERROR('El código de documento ya existe.', 16, 1);
            RETURN;
        END

        IF NOT EXISTS (
            SELECT 1 FROM dbo.TB_TipoDocumento
            WHERE NombreDocumento = @TipoDocumento
        )
        BEGIN
            RAISERROR('El tipo de documento no es válido.', 16, 1);
            RETURN;
        END

        INSERT INTO dbo.TB_Documento
            (CodigoDocumento, TipoDocumento, IdBien, RutaArchivo,
             IdArchivoGoogleDrive, NombreArchivoOriginal, TamanoKB, Extension,
             FechaGeneracion, FechaCarga, UsuarioGenerador, Estado)
        VALUES
            (@CodigoDocumento, @TipoDocumento, @IdBien, @RutaArchivo,
             @IdArchivoGoogleDrive, @NombreArchivoOriginal, @TamanoKB, @Extension,
             GETDATE(), GETDATE(), @IdUsuario, 1);

        SET @IdDocumento = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT IdDocumento = @IdDocumento, IdBien = @IdBien, CodigoDocumento = @CodigoDocumento,
           IdArchivoGoogleDrive = @IdArchivoGoogleDrive, Estado = 1;
END
GO

/* ===========================================================================
   6) SP_LISTARDOCUMENTOSBIEN
   =========================================================================== */
IF OBJECT_ID('dbo.SP_ListarDocumentosBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarDocumentosBien;
GO

CREATE PROCEDURE dbo.SP_ListarDocumentosBien
    @IdBien INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT IdDocumento, CodigoDocumento, TipoDocumento, IdBien, IdMovimiento,
           IdPrestamo, RutaArchivo, IdArchivoGoogleDrive, NombreArchivoOriginal,
           TamanoKB, Extension, FechaGeneracion, FechaCarga, UsuarioGenerador, Estado
    FROM dbo.TB_Documento
    WHERE IdBien = @IdBien AND Estado = 1
    ORDER BY FechaCarga DESC, IdDocumento DESC;
END
GO

/* ===========================================================================
   7) SP_CAMBIARESTADOFOTO (soft delete; nunca borra fisicamente)
   =========================================================================== */
IF OBJECT_ID('dbo.SP_CambiarEstadoFoto', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CambiarEstadoFoto;
GO

CREATE PROCEDURE dbo.SP_CambiarEstadoFoto
    @IdFoto   INT,
    @Estado   BIT,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_FotoBien WHERE IdFoto = @IdFoto)
    BEGIN
        RAISERROR('La foto no existe.', 16, 1);
        RETURN;
    END

    UPDATE dbo.TB_FotoBien
    SET Estado = @Estado
    WHERE IdFoto = @IdFoto;

    SELECT IdFoto = @IdFoto, Estado = @Estado;
END
GO

/* ===========================================================================
   8) SP_LISTARTIPOSDOCUMENTO (catalogo)
   =========================================================================== */
IF OBJECT_ID('dbo.SP_ListarTiposDocumento', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarTiposDocumento;
GO

CREATE PROCEDURE dbo.SP_ListarTiposDocumento
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IdTipoDocumento, NombreDocumento, CodigoDocumento
    FROM dbo.TB_TipoDocumento
    ORDER BY IdTipoDocumento;
END
GO

PRINT 'FASE 5 - SPs de archivos creados correctamente.';
GO

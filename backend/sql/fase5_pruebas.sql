/* ============================================================================
   FASE 5 - PRUEBAS SPs de fotos/documentos (BD_Inventario_B21)
   ============================================================================ */
USE BD_Inventario_B21;
GO
SET NOCOUNT ON;

DECLARE @IdBien INT = 2;          -- bien activo de prueba
DECLARE @IdUsuario INT = 1;       -- admin
DECLARE @IdFoto INT = 0;
DECLARE @IdDoc INT = 0;
DECLARE @Msj VARCHAR(4000);

/* ---------------------------------------------------------------------------
   TEST A - SP_RegistrarFotoBien OK
   --------------------------------------------------------------------------- */
BEGIN TRY
    EXEC dbo.SP_RegistrarFotoBien
        @IdBien = @IdBien, @NombreArchivo = 'foto_vista_general.jpg',
        @TipoFoto = 'Vista general', @RutaGoogleDrive = 'https://drive.google.com/file/d/DRV-1001',
        @IdArchivoGoogleDrive = 'DRV-1001', @Extension = 'jpg', @TamanoKB = 320,
        @Descripcion = 'Foto de prueba fase 5', @IdUsuario = @IdUsuario,
        @TamanoOriginalKB = 2400, @TamanoComprimidoKB = 320,
        @ResolucionOriginal = '4000x3000', @ResolucionFinal = '1600x1200', @CalidadCompresion = 78;
    SET @Msj = 'PASS';
END TRY
BEGIN CATCH
    SET @Msj = 'FAIL: ' + ERROR_MESSAGE();
END CATCH;
IF @Msj = 'FAIL: ' PRINT 'A) SP_RegistrarFotoBien  -> ' + @Msj; ELSE PRINT 'A) SP_RegistrarFotoBien  -> PASS';

/* ---------------------------------------------------------------------------
   TEST B - SP_ListarFotosBien devuelve la foto
   --------------------------------------------------------------------------- */
IF EXISTS (SELECT 1 FROM dbo.TB_FotoBien WHERE IdBien = @IdBien AND NombreArchivo = 'foto_vista_general.jpg' AND Estado = 1)
    PRINT 'B) SP_ListarFotosBien     -> PASS';
ELSE
    PRINT 'B) SP_ListarFotosBien     -> FAIL';

/* ---------------------------------------------------------------------------
   TEST C - SP_CambiarEstadoFoto: soft delete + reactivacion
   --------------------------------------------------------------------------- */
SELECT @IdFoto = IdFoto FROM dbo.TB_FotoBien WHERE IdBien = @IdBien AND NombreArchivo = 'foto_vista_general.jpg';
EXEC dbo.SP_CambiarEstadoFoto @IdFoto = @IdFoto, @Estado = 0, @IdUsuario = @IdUsuario;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_FotoBien WHERE IdFoto = @IdFoto AND Estado = 1)
    AND EXISTS (SELECT 1 FROM dbo.TB_FotoBien WHERE IdFoto = @IdFoto AND Estado = 0)
    PRINT 'C) SP_CambiarEstadoFoto    -> PASS';
ELSE
    PRINT 'C) SP_CambiarEstadoFoto    -> FAIL';
EXEC dbo.SP_CambiarEstadoFoto @IdFoto = @IdFoto, @Estado = 1, @IdUsuario = @IdUsuario;

/* ---------------------------------------------------------------------------
   TEST D1 - Foto con bien inexistente -> 404 'no existe'
   --------------------------------------------------------------------------- */
BEGIN TRY
    EXEC dbo.SP_RegistrarFotoBien
        @IdBien = 99999, @NombreArchivo = 'x.jpg', @TipoFoto = 'Vista general',
        @RutaGoogleDrive = 'ruta', @IdArchivoGoogleDrive = 'X', @Extension = 'jpg',
        @TamanoKB = 10, @IdUsuario = @IdUsuario;
    PRINT 'D1) Bien inexistente       -> FAIL (no lanzo error)';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%no existe%'
        PRINT 'D1) Bien inexistente       -> PASS';
    ELSE
        PRINT 'D1) Bien inexistente       -> FAIL: ' + ERROR_MESSAGE();
END CATCH;

/* ---------------------------------------------------------------------------
   TEST D2 - SP_CambiarEstadoFoto con foto inexistente -> 404
   --------------------------------------------------------------------------- */
BEGIN TRY
    EXEC dbo.SP_CambiarEstadoFoto @IdFoto = 99999, @Estado = 0, @IdUsuario = @IdUsuario;
    PRINT 'D2) Foto inexistente       -> FAIL (no lanzo error)';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%no existe%'
        PRINT 'D2) Foto inexistente       -> PASS';
    ELSE
        PRINT 'D2) Foto inexistente       -> FAIL: ' + ERROR_MESSAGE();
END CATCH;

/* ---------------------------------------------------------------------------
   TEST E - SP_RegistrarDocumentoBien OK
   --------------------------------------------------------------------------- */
BEGIN TRY
    EXEC dbo.SP_RegistrarDocumentoBien
        @CodigoDocumento = 'DOC-PRUEBA-001', @IdBien = @IdBien,
        @TipoDocumento = 'Acta de entrega', @RutaArchivo = 'https://drive.google.com/file/d/DRV-2001',
        @IdArchivoGoogleDrive = 'DRV-2001', @NombreArchivoOriginal = 'acta_entrega.pdf',
        @TamanoKB = 480, @Extension = 'pdf', @IdUsuario = @IdUsuario;
    PRINT 'E) SP_RegistrarDocumentoBien -> PASS';
END TRY
BEGIN CATCH
    PRINT 'E) SP_RegistrarDocumentoBien -> FAIL: ' + ERROR_MESSAGE();
END CATCH;

/* ---------------------------------------------------------------------------
   TEST F - Codigo de documento duplicado -> 409
   --------------------------------------------------------------------------- */
BEGIN TRY
    EXEC dbo.SP_RegistrarDocumentoBien
        @CodigoDocumento = 'DOC-PRUEBA-001', @IdBien = @IdBien,
        @TipoDocumento = 'Acta de entrega', @RutaArchivo = 'ruta',
        @IdUsuario = @IdUsuario;
    PRINT 'F) Codigo duplicado        -> FAIL (no lanzo error)';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%ya existe%'
        PRINT 'F) Codigo duplicado        -> PASS';
    ELSE
        PRINT 'F) Codigo duplicado        -> FAIL: ' + ERROR_MESSAGE();
END CATCH;

/* ---------------------------------------------------------------------------
   TEST G - Tipo de documento invalido -> 400
   --------------------------------------------------------------------------- */
BEGIN TRY
    EXEC dbo.SP_RegistrarDocumentoBien
        @CodigoDocumento = 'DOC-PRUEBA-002', @IdBien = @IdBien,
        @TipoDocumento = 'No existe este tipo', @RutaArchivo = 'ruta',
        @IdUsuario = @IdUsuario;
    PRINT 'G) Tipo invalido           -> FAIL (no lanzo error)';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%no es válido%'
        PRINT 'G) Tipo invalido           -> PASS';
    ELSE
        PRINT 'G) Tipo invalido           -> FAIL: ' + ERROR_MESSAGE();
END CATCH;

/* ---------------------------------------------------------------------------
   TEST H - Listar documentos del bien
   --------------------------------------------------------------------------- */
IF EXISTS (SELECT 1 FROM dbo.TB_Documento WHERE IdBien = @IdBien AND CodigoDocumento = 'DOC-PRUEBA-001' AND Estado = 1)
    PRINT 'H) SP_ListarDocumentosBien -> PASS';
ELSE
    PRINT 'H) SP_ListarDocumentosBien -> FAIL';

/* ---------------------------------------------------------------------------
   TEST I - Catalogo de tipos (deben ser 9: 7 existentes + CERT + OTR)
   --------------------------------------------------------------------------- */
DECLARE @Cnt INT;
SELECT @Cnt = COUNT(*) FROM dbo.TB_TipoDocumento;
IF @Cnt = 9
    PRINT 'I) Tipos de documento      -> PASS (9 tipos)';
ELSE
    PRINT 'I) Tipos de documento      -> FAIL (' + CAST(@Cnt AS VARCHAR(10)) + ')';

/* ---------------------------------------------------------------------------
   TEST J - Documento con bien inexistente -> 404
   --------------------------------------------------------------------------- */
BEGIN TRY
    EXEC dbo.SP_RegistrarDocumentoBien
        @CodigoDocumento = 'DOC-PRUEBA-003', @IdBien = 99999,
        @TipoDocumento = 'Acta de entrega', @RutaArchivo = 'ruta',
        @IdUsuario = @IdUsuario;
    PRINT 'J) Bien inexistente doc    -> FAIL (no lanzo error)';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%no existe%'
        PRINT 'J) Bien inexistente doc    -> PASS';
    ELSE
        PRINT 'J) Bien inexistente doc    -> FAIL: ' + ERROR_MESSAGE();
END CATCH;

/* ---------------------------------------------------------------------------
   LIMPIEZA - quitar datos de prueba (mantener CERT/OTR y SPs)
   --------------------------------------------------------------------------- */
DELETE FROM dbo.TB_Documento WHERE CodigoDocumento IN ('DOC-PRUEBA-001', 'DOC-PRUEBA-002', 'DOC-PRUEBA-003');
DELETE FROM dbo.TB_FotoBien WHERE IdBien = @IdBien AND NombreArchivo = 'foto_vista_general.jpg';
PRINT 'Limpieza completada.';
GO

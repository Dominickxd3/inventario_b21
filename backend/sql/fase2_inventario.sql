/* =============================================================================
   FASE 2 - Inventario: correcciones y SPs
   BD: BD_Inventario_B21
   ============================================================================= */

/* ---------------------------------------------------------------------------
   1) FIX TR_ControlMovimientoDetalle
   El trigger original (AFTER INSERT en TB_Movimiento) rompía el flujo
   cabecera->detalle. Se reemplaza por validación DIFERIDA: solo valida cuando
   el movimiento pasa a Estado='CERRADO' y no tiene detalle.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.TR_ControlMovimientoDetalle', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_ControlMovimientoDetalle;
GO

CREATE TRIGGER dbo.TR_ControlMovimientoDetalle
ON dbo.TB_Movimiento
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        WHERE I.Estado = 'CERRADO'
          AND NOT EXISTS (
              SELECT 1 FROM dbo.TB_MovimientoDetalle D
              WHERE D.IdMovimiento = I.IdMovimiento
          )
    )
    BEGIN
        RAISERROR('El movimiento debe tener al menos un bien asociado antes de cerrarse.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END
GO

/* ---------------------------------------------------------------------------
   2) MEJORA TR_GenerarKardexMovimiento
   El kardex ahora incluye el tipo de movimiento y el código MOV.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.TR_GenerarKardexMovimiento', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_GenerarKardexMovimiento;
GO

CREATE TRIGGER dbo.TR_GenerarKardexMovimiento
ON dbo.TB_MovimientoDetalle
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TB_Kardex (IdBien, IdMovimiento, Fecha, Detalle, UsuarioRegistro)
    SELECT
        I.IdBien,
        I.IdMovimiento,
        GETDATE(),
        ISNULL(TM.NombreMovimiento, 'Movimiento') + ' - ' + ISNULL(M.CodigoMovimiento, ''),
        M.IdUsuario
    FROM inserted I
    LEFT JOIN dbo.TB_Movimiento M ON M.IdMovimiento = I.IdMovimiento
    LEFT JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento;
END
GO

/* ---------------------------------------------------------------------------
   3) SP_RegistrarArticulo
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_RegistrarArticulo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarArticulo;
GO

CREATE PROCEDURE dbo.SP_RegistrarArticulo
    @CodigoArticulo VARCHAR(20),
    @NombreArticulo VARCHAR(150),
    @Descripcion VARCHAR(500) = NULL,
    @TipoControl VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM (VALUES ('INDIVIDUAL'),('KIT'),('STOCK')) V(Tipo)
                   WHERE V.Tipo = UPPER(@TipoControl))
    BEGIN
        RAISERROR('El TipoControl debe ser INDIVIDUAL, KIT o STOCK.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM dbo.TB_Articulo WHERE CodigoArticulo = @CodigoArticulo)
    BEGIN
        RAISERROR('El código de artículo ya existe.', 16, 1);
        RETURN;
    END

    INSERT INTO dbo.TB_Articulo (CodigoArticulo, NombreArticulo, Descripcion, TipoControl, Estado, FechaRegistro)
    VALUES (UPPER(@CodigoArticulo), @NombreArticulo, @Descripcion, UPPER(@TipoControl), 1, GETDATE());

    SELECT SCOPE_IDENTITY() AS IdArticulo;
END
GO

/* ---------------------------------------------------------------------------
   4) SP_ActualizarArticulo
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ActualizarArticulo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ActualizarArticulo;
GO

CREATE PROCEDURE dbo.SP_ActualizarArticulo
    @IdArticulo INT,
    @CodigoArticulo VARCHAR(20),
    @NombreArticulo VARCHAR(150),
    @Descripcion VARCHAR(500) = NULL,
    @TipoControl VARCHAR(20),
    @Estado BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Articulo WHERE IdArticulo = @IdArticulo)
    BEGIN
        RAISERROR('El artículo no existe.', 16, 1);
        RETURN;
    END

    UPDATE dbo.TB_Articulo
    SET CodigoArticulo = UPPER(@CodigoArticulo),
        NombreArticulo = @NombreArticulo,
        Descripcion = @Descripcion,
        TipoControl = UPPER(@TipoControl),
        Estado = @Estado
    WHERE IdArticulo = @IdArticulo;
END
GO

/* ---------------------------------------------------------------------------
   5) SP_ListarArticulos
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ListarArticulos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarArticulos;
GO

CREATE PROCEDURE dbo.SP_ListarArticulos
    @Filtro VARCHAR(100) = NULL,
    @IncluirInactivos BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT A.IdArticulo, A.CodigoArticulo, A.NombreArticulo, A.Descripcion,
           A.TipoControl, A.Estado, A.FechaRegistro,
           (SELECT COUNT(*) FROM dbo.TB_Bien B WHERE B.IdArticulo = A.IdArticulo AND ISNULL(B.Eliminado, 0) = 0) AS CantidadBienes
    FROM dbo.TB_Articulo A
    WHERE (@IncluirInactivos = 1 OR A.Estado = 1)
      AND (@Filtro IS NULL OR A.CodigoArticulo LIKE '%' + @Filtro + '%' OR A.NombreArticulo LIKE '%' + @Filtro + '%')
    ORDER BY A.IdArticulo;
END
GO

/* ---------------------------------------------------------------------------
   6) SP_RegistrarBien
   Inserta el bien (el trigger genera B21), crea movimiento INGRESO y su
   detalle (el trigger genera el kardex) y registra la asignación inicial.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_RegistrarBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarBien;
GO

CREATE PROCEDURE dbo.SP_RegistrarBien
    @IdArticulo INT,
    @CodigoPatrimonial VARCHAR(100) = NULL,
    @NumeroSerie VARCHAR(100) = NULL,
    @IdMarca INT = NULL,
    @IdModelo INT = NULL,
    @Descripcion VARCHAR(250) = NULL,
    @IdEstado INT,
    @IdUbicacion INT = NULL,
    @IdResponsableActual INT = NULL,
    @FechaIngreso DATE = NULL,
    @AñoFabricacion INT = NULL,
    @ValorAdquisicion DECIMAL(18,2) = NULL,
    @Observaciones VARCHAR(MAX) = NULL,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdBien INT;
    DECLARE @IdMovimiento INT;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Articulo WHERE IdArticulo = @IdArticulo AND Estado = 1)
    BEGIN
        RAISERROR('El artículo no existe o está inactivo.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_EstadoBien WHERE IdEstado = @IdEstado)
    BEGIN
        RAISERROR('El estado no es válido.', 16, 1);
        RETURN;
    END

    IF @IdResponsableActual IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero WHERE IdBombero = @IdResponsableActual AND Estado = 1)
    BEGIN
        RAISERROR('El responsable no existe o está inactivo.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.TB_Bien
            (IdArticulo, CodigoPatrimonial, NumeroSerie, IdMarca, IdModelo, Descripcion,
             IdEstado, IdUbicacion, IdResponsableActual, FechaIngreso, AñoFabricacion,
             ValorAdquisicion, Observaciones, FechaRegistro, Eliminado)
        VALUES
            (@IdArticulo, @CodigoPatrimonial, @NumeroSerie, @IdMarca, @IdModelo, @Descripcion,
             @IdEstado, @IdUbicacion, @IdResponsableActual, ISNULL(@FechaIngreso, GETDATE()),
             @AñoFabricacion, @ValorAdquisicion, @Observaciones, GETDATE(), 0);

        SET @IdBien = SCOPE_IDENTITY();

        -- Movimiento de ingreso (IdTipoMovimiento 1 = Ingreso)
        INSERT INTO dbo.TB_Movimiento (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
        VALUES (1, GETDATE(), @IdUsuario, ISNULL(@Observaciones, 'Ingreso inicial de bien'), NULL);

        SET @IdMovimiento = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_MovimientoDetalle
            (IdMovimiento, IdBien, EstadoAntes, EstadoDespues, UbicacionAntes, UbicacionDespues,
             ResponsableAntes, ResponsableDespues)
        VALUES
            (@IdMovimiento, @IdBien, NULL, @IdEstado, NULL, @IdUbicacion, NULL, @IdResponsableActual);

        -- Asignación inicial (si se indicó responsable)
        IF @IdResponsableActual IS NOT NULL
        BEGIN
            INSERT INTO dbo.TB_HistorialAsignacion (IdBien, IdBombero, FechaAsignacion, FechaFin, Motivo)
            VALUES (@IdBien, @IdResponsableActual, GETDATE(), NULL, 'Asignación inicial');
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH

    SELECT B.IdBien, B.CodigoInterno, @IdMovimiento AS IdMovimiento
    FROM dbo.TB_Bien B
    WHERE B.IdBien = @IdBien;
END
GO

/* ---------------------------------------------------------------------------
   7) SP_ListarBienes
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ListarBienes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarBienes;
GO

CREATE PROCEDURE dbo.SP_ListarBienes
    @Filtro VARCHAR(100) = NULL,
    @IdArticulo INT = NULL,
    @IdEstado INT = NULL,
    @IdUbicacion INT = NULL,
    @IdResponsableActual INT = NULL,
    @IncluirEliminados BIT = 0,
    @Pagina INT = 1,
    @Filas INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Pagina - 1) * @Filas;

    SELECT B.IdBien, B.CodigoInterno, B.CodigoPatrimonial, B.NumeroSerie,
           A.IdArticulo, A.CodigoArticulo, A.NombreArticulo, A.TipoControl,
           B.IdMarca, MAR.NombreMarca,
           B.IdModelo, MOD.NombreModelo,
           B.IdEstado, EST.NombreEstado,
           B.IdUbicacion, UB.NombreUbicacion,
           B.IdResponsableActual,
           BO.CodigoBombero,
           (BO.Nombres + ' ' + BO.Apellidos) AS Responsable,
           B.FechaIngreso, B.Descripcion, B.Observaciones, B.Eliminado
    FROM dbo.TB_Bien B
    JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    LEFT JOIN dbo.TB_Marca MAR ON MAR.IdMarca = B.IdMarca
    LEFT JOIN dbo.TB_Modelo MOD ON MOD.IdModelo = B.IdModelo
    JOIN dbo.TB_EstadoBien EST ON EST.IdEstado = B.IdEstado
    LEFT JOIN dbo.TB_Ubicacion UB ON UB.IdUbicacion = B.IdUbicacion
    LEFT JOIN dbo.TB_Bombero BO ON BO.IdBombero = B.IdResponsableActual
    WHERE (@IncluirEliminados = 1 OR ISNULL(B.Eliminado, 0) = 0)
      AND (@Filtro IS NULL OR B.CodigoInterno LIKE '%' + @Filtro + '%'
           OR A.NombreArticulo LIKE '%' + @Filtro + '%'
           OR B.NumeroSerie LIKE '%' + @Filtro + '%')
      AND (@IdArticulo IS NULL OR B.IdArticulo = @IdArticulo)
      AND (@IdEstado IS NULL OR B.IdEstado = @IdEstado)
      AND (@IdUbicacion IS NULL OR B.IdUbicacion = @IdUbicacion)
      AND (@IdResponsableActual IS NULL OR B.IdResponsableActual = @IdResponsableActual)
    ORDER BY B.IdBien DESC
    OFFSET @Offset ROWS FETCH NEXT @Filas ROWS ONLY;

    SELECT COUNT(*) AS Total
    FROM dbo.TB_Bien B
    JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    WHERE (@IncluirEliminados = 1 OR ISNULL(B.Eliminado, 0) = 0)
      AND (@Filtro IS NULL OR B.CodigoInterno LIKE '%' + @Filtro + '%'
           OR A.NombreArticulo LIKE '%' + @Filtro + '%'
           OR B.NumeroSerie LIKE '%' + @Filtro + '%')
      AND (@IdArticulo IS NULL OR B.IdArticulo = @IdArticulo)
      AND (@IdEstado IS NULL OR B.IdEstado = @IdEstado)
      AND (@IdUbicacion IS NULL OR B.IdUbicacion = @IdUbicacion)
      AND (@IdResponsableActual IS NULL OR B.IdResponsableActual = @IdResponsableActual);
END
GO

/* ---------------------------------------------------------------------------
   8) SP_ObtenerFichaBien
   Varios result sets: ficha, componentes, historial de estado, historial de
   asignaciones, kardex, fotos y QR.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ObtenerFichaBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ObtenerFichaBien;
GO

CREATE PROCEDURE dbo.SP_ObtenerFichaBien
    @CodigoInterno VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IdBien INT;

    SELECT @IdBien = B.IdBien
    FROM dbo.TB_Bien B
    WHERE B.CodigoInterno = @CodigoInterno;

    IF @IdBien IS NULL
    BEGIN
        RAISERROR('El bien no fue encontrado.', 16, 1);
        RETURN;
    END

    -- 1) FICHA
    SELECT B.IdBien, B.CodigoInterno, B.CodigoPatrimonial, B.NumeroSerie,
           A.IdArticulo, A.CodigoArticulo, A.NombreArticulo, A.TipoControl,
           B.Descripcion,
           B.IdMarca, MAR.NombreMarca,
           B.IdModelo, MOD.NombreModelo,
           B.IdEstado, EST.NombreEstado,
           B.IdUbicacion, UB.NombreUbicacion, UB.TipoUbicacion,
           B.IdResponsableActual,
           BO.CodigoBombero,
           (BO.Nombres + ' ' + BO.Apellidos) AS Responsable,
           B.FechaIngreso, B.AñoFabricacion, B.ValorAdquisicion,
           B.Observaciones, B.Eliminado
    FROM dbo.TB_Bien B
    JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    LEFT JOIN dbo.TB_Marca MAR ON MAR.IdMarca = B.IdMarca
    LEFT JOIN dbo.TB_Modelo MOD ON MOD.IdModelo = B.IdModelo
    JOIN dbo.TB_EstadoBien EST ON EST.IdEstado = B.IdEstado
    LEFT JOIN dbo.TB_Ubicacion UB ON UB.IdUbicacion = B.IdUbicacion
    LEFT JOIN dbo.TB_Bombero BO ON BO.IdBombero = B.IdResponsableActual
    WHERE B.IdBien = @IdBien;

    -- 2) COMPONENTES (si el bien es un KIT / tiene componentes)
    SELECT CH.IdBien, CH.CodigoInterno, A.NombreArticulo, CH.NumeroSerie,
           BR.TipoRelacion
    FROM dbo.TB_BienRelacion BR
    JOIN dbo.TB_Bien CH ON CH.IdBien = BR.IdBienHijo
    JOIN dbo.TB_Articulo A ON A.IdArticulo = CH.IdArticulo
    WHERE BR.IdBienPadre = @IdBien
      AND ISNULL(CH.Eliminado, 0) = 0;

    -- 3) HISTORIAL DE ESTADO
    SELECT HE.IdHistorialEstado, HE.EstadoAnterior, EA.NombreEstado AS NombreEstadoAnterior,
           HE.EstadoNuevo, EN.NombreEstado AS NombreEstadoNuevo,
           HE.Motivo, HE.FechaCambio, HE.UsuarioCambio
    FROM dbo.TB_HistorialEstadoBien HE
    LEFT JOIN dbo.TB_EstadoBien EA ON EA.IdEstado = HE.EstadoAnterior
    LEFT JOIN dbo.TB_EstadoBien EN ON EN.IdEstado = HE.EstadoNuevo
    WHERE HE.IdBien = @IdBien
    ORDER BY HE.FechaCambio DESC;

    -- 4) HISTORIAL DE ASIGNACIONES
    SELECT HA.IdHistorialAsignacion, HA.IdBombero,
           (BO.Nombres + ' ' + BO.Apellidos) AS Responsable,
           HA.FechaAsignacion, HA.FechaFin, HA.Motivo
    FROM dbo.TB_HistorialAsignacion HA
    LEFT JOIN dbo.TB_Bombero BO ON BO.IdBombero = HA.IdBombero
    WHERE HA.IdBien = @IdBien
    ORDER BY HA.FechaAsignacion DESC;

    -- 5) KARDEX
    SELECT K.IdKardex, K.Fecha, M.CodigoMovimiento, TM.NombreMovimiento,
           K.Detalle, K.UsuarioRegistro
    FROM dbo.TB_Kardex K
    LEFT JOIN dbo.TB_Movimiento M ON M.IdMovimiento = K.IdMovimiento
    LEFT JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    WHERE K.IdBien = @IdBien
    ORDER BY K.Fecha DESC;

    -- 6) FOTOS (solo metadata; la fase de fotos viene después)
    SELECT F.IdFoto, F.NombreArchivo, F.TipoFoto, F.RutaGoogleDrive,
           F.Extension, F.TamanoKB, F.Descripcion, F.FechaCarga
    FROM dbo.TB_FotoBien F
    WHERE F.IdBien = @IdBien
      AND F.Estado = 1
    ORDER BY F.FechaCarga DESC;

    -- 7) QR REGISTRADO
    SELECT TOP 1 Q.IdQR, Q.CodigoQR, Q.FechaGeneracion
    FROM dbo.TB_QR_Bien Q
    WHERE Q.IdBien = @IdBien
    ORDER BY Q.FechaGeneracion DESC;
END
GO

/* ---------------------------------------------------------------------------
   9) SP_ActualizarBien
   Actualiza SOLO datos administrativos. Nunca CodigoInterno. El estado y el
   responsable se manejan con SP_CambiarEstadoSeguro / SP_AsignarBienSeguro.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ActualizarBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ActualizarBien;
GO

CREATE PROCEDURE dbo.SP_ActualizarBien
    @IdBien INT,
    @CodigoPatrimonial VARCHAR(100) = NULL,
    @NumeroSerie VARCHAR(100) = NULL,
    @IdMarca INT = NULL,
    @IdModelo INT = NULL,
    @Descripcion VARCHAR(250) = NULL,
    @FechaIngreso DATE = NULL,
    @AñoFabricacion INT = NULL,
    @ValorAdquisicion DECIMAL(18,2) = NULL,
    @Observaciones VARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0)
    BEGIN
        RAISERROR('El bien no existe o está eliminado.', 16, 1);
        RETURN;
    END

    UPDATE dbo.TB_Bien
    SET CodigoPatrimonial = ISNULL(@CodigoPatrimonial, CodigoPatrimonial),
        NumeroSerie = ISNULL(@NumeroSerie, NumeroSerie),
        IdMarca = ISNULL(@IdMarca, IdMarca),
        IdModelo = ISNULL(@IdModelo, IdModelo),
        Descripcion = ISNULL(@Descripcion, Descripcion),
        FechaIngreso = ISNULL(@FechaIngreso, FechaIngreso),
        AñoFabricacion = ISNULL(@AñoFabricacion, AñoFabricacion),
        ValorAdquisicion = ISNULL(@ValorAdquisicion, ValorAdquisicion),
        Observaciones = ISNULL(@Observaciones, Observaciones)
    WHERE IdBien = @IdBien;
END
GO

/* ---------------------------------------------------------------------------
   10) SP_CambiarUbicacionBien
   Cambia la ubicación y registra movimiento de transferencia (kardex).
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_CambiarUbicacionBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CambiarUbicacionBien;
GO

CREATE PROCEDURE dbo.SP_CambiarUbicacionBien
    @IdBien INT,
    @IdNuevaUbicacion INT,
    @IdUsuario INT,
    @Motivo VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IdUbicacionAnterior INT;
    DECLARE @IdMovimiento INT;

    SELECT @IdUbicacionAnterior = IdUbicacion
    FROM dbo.TB_Bien
    WHERE IdBien = @IdBien;

    IF @IdUbicacionAnterior IS NULL AND @IdBien IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = @IdBien)
    BEGIN
        RAISERROR('El bien no existe.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Ubicacion WHERE IdUbicacion = @IdNuevaUbicacion)
    BEGIN
        RAISERROR('La ubicación no es válida.', 16, 1);
        RETURN;
    END

    IF @IdUbicacionAnterior = @IdNuevaUbicacion
    BEGIN
        RETURN;
    END

    INSERT INTO dbo.TB_Movimiento (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
    VALUES (5, GETDATE(), @IdUsuario, ISNULL(@Motivo, 'Cambio de ubicación'), NULL);

    SET @IdMovimiento = SCOPE_IDENTITY();

    INSERT INTO dbo.TB_MovimientoDetalle
        (IdMovimiento, IdBien, UbicacionAntes, UbicacionDespues)
    VALUES
        (@IdMovimiento, @IdBien, @IdUbicacionAnterior, @IdNuevaUbicacion);

    UPDATE dbo.TB_Bien
    SET IdUbicacion = @IdNuevaUbicacion
    WHERE IdBien = @IdBien;
END
GO

/* ---------------------------------------------------------------------------
   11) SP_RegistrarQRBien
   Registra la generación de QR (no almacena la imagen). El PNG se genera a
   demanda por el backend.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_RegistrarQRBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarQRBien;
GO

CREATE PROCEDURE dbo.SP_RegistrarQRBien
    @IdBien INT,
    @CodigoQR VARCHAR(200),
    @ContenidoQR VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = @IdBien)
    BEGIN
        RAISERROR('El bien no existe.', 16, 1);
        RETURN;
    END

    INSERT INTO dbo.TB_QR_Bien (IdBien, CodigoQR, FechaGeneracion)
    VALUES (@IdBien, @CodigoQR, GETDATE());

    INSERT INTO dbo.TB_QRGenerado (IdBien, CodigoQR, ContenidoQR, FechaGeneracion, Estado)
    VALUES (@IdBien, @CodigoQR, @ContenidoQR, GETDATE(), 1);

    SELECT SCOPE_IDENTITY() AS IdQR;
END
GO

/* ---------------------------------------------------------------------------
   12) SP_ListarCatalogos
   Result sets: marcas, modelos, estados, ubicaciones, tipos de movimiento.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ListarCatalogos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarCatalogos;
GO

CREATE PROCEDURE dbo.SP_ListarCatalogos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IdMarca, NombreMarca
    FROM dbo.TB_Marca
    ORDER BY NombreMarca;

    SELECT M.IdModelo, M.NombreModelo, M.IdMarca, MA.NombreMarca
    FROM dbo.TB_Modelo M
    LEFT JOIN dbo.TB_Marca MA ON MA.IdMarca = M.IdMarca
    ORDER BY M.NombreModelo;

    SELECT IdEstado, NombreEstado
    FROM dbo.TB_EstadoBien
    ORDER BY IdEstado;

    SELECT U.IdUbicacion, U.NombreUbicacion, U.TipoUbicacion,
           U.IdUbicacionPadre, P.NombreUbicacion AS NombreUbicacionPadre
    FROM dbo.TB_Ubicacion U
    LEFT JOIN dbo.TB_Ubicacion P ON P.IdUbicacion = U.IdUbicacionPadre
    ORDER BY U.NombreUbicacion;

    SELECT IdTipoMovimiento, NombreMovimiento
    FROM dbo.TB_TipoMovimiento
    ORDER BY IdTipoMovimiento;
END
GO

PRINT 'FASE 2 - SPs de inventario creados.';
GO

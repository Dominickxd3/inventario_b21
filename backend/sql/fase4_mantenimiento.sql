/* ============================================================================
   FASE 4 - MANTENIMIENTO (Sistema de Inventario y Trazabilidad B21)
   ----------------------------------------------------------------------------
   Cambios:
     1) TB_Mantenimiento        : + columna Observaciones VARCHAR(MAX) (aprobado).
     2) TB_MantenimientoRepuesto: tabla nueva para repuestos usados (aprobado).
     3) SP_RegistrarMantenimiento   : bien -> Averiado -> Mantenimiento.
     4) SP_FinalizarMantenimiento   : Mantenimiento -> Operativo.
     5) SP_ListarMantenimientos     : lista paginada (2 result sets).
     6) SP_ObtenerMantenimiento     : ficha + repuestos.

   Reglas respetadas:
     - SPs legacy intactos (no existian SPs de mantenimiento).
     - Toda operacion critica genera: TB_Movimiento + TB_MovimientoDetalle
       (kardex via TR_GenerarKardexMovimiento) + TB_HistorialEstadoBien.
     - Auditoria TB_Bien cubierta por TR_Auditoria_Bien_Update.
     - Estados resueltos por nombre, sin numeros quemados.
     - Transaccional con XACT_ABORT ON + TRY/CATCH.
   ============================================================================ */

USE BD_Inventario_B21;
GO

/* ---------------------------------------------------------------------------
   1) COLUMNA OBSERVACIONES EN TB_MANTENIMIENTO (aditiva, aprobada)
   --------------------------------------------------------------------------- */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.TB_Mantenimiento')
      AND name = 'Observaciones'
)
BEGIN
    ALTER TABLE dbo.TB_Mantenimiento
        ADD Observaciones VARCHAR(MAX) NULL;
END
GO

/* ---------------------------------------------------------------------------
   2) TB_MANTENIMIENTOREPUESTO (tabla nueva, aprobada)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.TB_MantenimientoRepuesto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_MantenimientoRepuesto (
        IdMantenimientoRepuesto INT IDENTITY(1,1) NOT NULL,
        IdMantenimiento         INT NOT NULL,
        NombreRepuesto          VARCHAR(200) NOT NULL,
        Cantidad                INT NOT NULL CONSTRAINT DF_MantoRep_Cantidad DEFAULT (1),
        CostoUnitario           DECIMAL(18,2) NOT NULL CONSTRAINT DF_MantoRep_Costo DEFAULT (0),
        CONSTRAINT PK_TB_MantenimientoRepuesto PRIMARY KEY (IdMantenimientoRepuesto),
        CONSTRAINT FK_MantenimientoRepuesto_Mantenimiento
            FOREIGN KEY (IdMantenimiento) REFERENCES dbo.TB_Mantenimiento (IdMantenimiento)
            ON DELETE CASCADE,
        CONSTRAINT CK_MantoRep_Cantidad CHECK (Cantidad >= 1),
        CONSTRAINT CK_MantoRep_Costo CHECK (CostoUnitario >= 0)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_MantenimientoRepuesto_IdMantenimiento'
      AND object_id = OBJECT_ID('dbo.TB_MantenimientoRepuesto')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_MantenimientoRepuesto_IdMantenimiento
        ON dbo.TB_MantenimientoRepuesto (IdMantenimiento);
END
GO

/* ===========================================================================
   3) SP_REGISTRARMANTENIMIENTO
   Flujo: Operativo/Nuevo/Averiado -> Averiado -> Mantenimiento (4)
   Genera: movimiento tipo Mantenimiento + detalle + kardex + historial estado.
   Repuestos (SQL Server 2014, sin OPENJSON): XML opcional
     <r><i><n>Filtro</n><c>2</c><u>10.5</u></i><i><n>Sello</n><c>1</c><u>25</u></i></r>
   =========================================================================== */
IF OBJECT_ID('dbo.SP_RegistrarMantenimiento', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarMantenimiento;
GO

CREATE PROCEDURE dbo.SP_RegistrarMantenimiento
    @IdBien               INT,
    @TipoMantenimiento    VARCHAR(50),
    @Diagnostico          VARCHAR(MAX) = NULL,
    @IdResponsableTecnico INT = NULL,
    @Observaciones        VARCHAR(MAX) = NULL,
    @Repuestos            NVARCHAR(MAX) = NULL,
    @IdUsuario            INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdEstadoActual INT;
    DECLARE @NombreResponsable VARCHAR(150);
    DECLARE @IdMovimiento INT;
    DECLARE @IdMantenimiento INT;
    DECLARE @hdoc INT;

    BEGIN TRY
        -- Bien existe y no eliminado
        SELECT @IdEstadoActual = B.IdEstado
        FROM dbo.TB_Bien B
        WHERE B.IdBien = @IdBien AND ISNULL(B.Eliminado, 0) = 0;

        IF @IdEstadoActual IS NULL
        BEGIN
            RAISERROR('El bien no existe o está eliminado.', 16, 1);
            RETURN;
        END

        -- Tipo de mantenimiento valido (guardamos el nombre, como el legacy)
        IF NOT EXISTS (
            SELECT 1 FROM dbo.TB_TipoMantenimiento
            WHERE Nombre = @TipoMantenimiento
        )
        BEGIN
            RAISERROR('El tipo de mantenimiento no es válido.', 16, 1);
            RETURN;
        END

        -- Responsable tecnico (bombero) opcional pero validado
        IF @IdResponsableTecnico IS NOT NULL
        BEGIN
            SELECT @NombreResponsable = LTRIM(RTRIM(
                       ISNULL(B.Nombres, '') + ' ' + ISNULL(B.Apellidos, '')))
            FROM dbo.TB_Bombero B
            WHERE B.IdBombero = @IdResponsableTecnico AND B.Estado = 1;

            IF @NombreResponsable IS NULL OR @NombreResponsable = ''
            BEGIN
                RAISERROR('El bombero técnico no existe o está inactivo.', 16, 1);
                RETURN;
            END
        END

        -- Repuestos: validar XML y contenido (SQL Server 2014)
        IF @Repuestos IS NOT NULL
        BEGIN
            BEGIN TRY
                EXEC sp_xml_preparedocument @hdoc OUTPUT, @Repuestos;
            END TRY
            BEGIN CATCH
                RAISERROR('El formato de repuestos no es válido.', 16, 1);
                RETURN;
            END CATCH

            IF @hdoc IS NULL OR @hdoc = 0
            BEGIN
                RAISERROR('El formato de repuestos no es válido.', 16, 1);
                RETURN;
            END

            IF EXISTS (
                SELECT 1
                FROM OPENXML(@hdoc, '/r/i', 2) WITH (
                    NombreRepuesto  VARCHAR(200) 'n',
                    Cantidad        INT          'c',
                    CostoUnitario   DECIMAL(18,2) 'u'
                )
                WHERE NombreRepuesto IS NULL OR LTRIM(RTRIM(NombreRepuesto)) = ''
                   OR Cantidad < 1 OR CostoUnitario < 0
            )
            BEGIN
                EXEC sp_xml_removedocument @hdoc;
                RAISERROR('Los datos de repuestos no son válidos.', 16, 1);
                RETURN;
            END

            EXEC sp_xml_removedocument @hdoc;
        END

        -- Estado del bien incompatible
        IF @IdEstadoActual = 4
        BEGIN
            RAISERROR('El bien ya se encuentra en mantenimiento.', 16, 1);
            RETURN;
        END

        IF @IdEstadoActual = 5
        BEGIN
            RAISERROR('No se puede registrar mantenimiento de un bien prestado.', 16, 1);
            RETURN;
        END

        IF @IdEstadoActual = 6
        BEGIN
            RAISERROR('No se puede registrar mantenimiento de un bien dado de baja.', 16, 1);
            RETURN;
        END

        BEGIN TRANSACTION;

        -- Transicion: (estado actual) -> Averiado -> Mantenimiento
        IF @IdEstadoActual <> 3
        BEGIN
            INSERT INTO dbo.TB_HistorialEstadoBien
                (IdBien, EstadoAnterior, EstadoNuevo, Motivo, FechaCambio, UsuarioCambio)
            VALUES
                (@IdBien, @IdEstadoActual, 3, 'Ingreso a mantenimiento', GETDATE(), @IdUsuario);
        END

        INSERT INTO dbo.TB_HistorialEstadoBien
            (IdBien, EstadoAnterior, EstadoNuevo, Motivo, FechaCambio, UsuarioCambio)
        VALUES
            (@IdBien, 3, 4, 'Ingreso a mantenimiento', GETDATE(), @IdUsuario);

        UPDATE dbo.TB_Bien
        SET IdEstado = 4
        WHERE IdBien = @IdBien;

        -- Movimiento + detalle (kardex automatico por trigger)
        INSERT INTO dbo.TB_Movimiento
            (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
        VALUES
            (6, GETDATE(), @IdUsuario,
             ISNULL(@Diagnostico, 'Registro de mantenimiento'), 'REGISTRADO');

        SET @IdMovimiento = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_MovimientoDetalle
            (IdMovimiento, IdBien, EstadoAntes, EstadoDespues)
        VALUES
            (@IdMovimiento, @IdBien, @IdEstadoActual, 4);

        -- Ficha de mantenimiento
        INSERT INTO dbo.TB_Mantenimiento
            (IdBien, TipoMantenimiento, FechaInicio, Diagnostico,
             Responsable, Estado, Observaciones)
        VALUES
            (@IdBien, @TipoMantenimiento, GETDATE(), @Diagnostico,
             @NombreResponsable, 'EN MANTENIMIENTO', @Observaciones);

        SET @IdMantenimiento = SCOPE_IDENTITY();

        -- Repuestos (segunda parseada dentro de la transaccion)
        IF @Repuestos IS NOT NULL
        BEGIN
            EXEC sp_xml_preparedocument @hdoc OUTPUT, @Repuestos;

            INSERT INTO dbo.TB_MantenimientoRepuesto
                (IdMantenimiento, NombreRepuesto, Cantidad, CostoUnitario)
            SELECT @IdMantenimiento, NombreRepuesto, Cantidad, CostoUnitario
            FROM OPENXML(@hdoc, '/r/i', 2) WITH (
                NombreRepuesto  VARCHAR(200) 'n',
                Cantidad        INT          'c',
                CostoUnitario   DECIMAL(18,2) 'u'
            );

            EXEC sp_xml_removedocument @hdoc;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        IdMantenimiento = @IdMantenimiento,
        IdMovimiento    = @IdMovimiento,
        CodigoMovimiento = M.CodigoMovimiento,
        Estado           = 'EN MANTENIMIENTO'
    FROM dbo.TB_Movimiento M
    WHERE M.IdMovimiento = @IdMovimiento;
END
GO

/* ===========================================================================
   4) SP_FINALIZARMANTENIMIENTO
   Flujo: Mantenimiento (4) -> Operativo (2)
   Genera: movimiento tipo Mantenimiento + detalle + kardex + historial estado.
   =========================================================================== */
IF OBJECT_ID('dbo.SP_FinalizarMantenimiento', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_FinalizarMantenimiento;
GO

CREATE PROCEDURE dbo.SP_FinalizarMantenimiento
    @IdMantenimiento  INT,
    @TrabajoRealizado VARCHAR(MAX) = NULL,
    @Costo            DECIMAL(18,2) = 0,
    @Observaciones    VARCHAR(MAX) = NULL,
    @FechaFin         DATETIME = NULL,
    @IdUsuario        INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdBien INT;
    DECLARE @EstadoActual VARCHAR(50);
    DECLARE @IdMovimiento INT;
    DECLARE @FechaSalida DATETIME;

    BEGIN TRY
        SELECT @IdBien = M.IdBien, @EstadoActual = M.Estado
        FROM dbo.TB_Mantenimiento M
        WHERE M.IdMantenimiento = @IdMantenimiento;

        IF @IdBien IS NULL
        BEGIN
            RAISERROR('El mantenimiento no existe.', 16, 1);
            RETURN;
        END

        IF @EstadoActual = 'FINALIZADO'
        BEGIN
            RAISERROR('El mantenimiento ya fue finalizado.', 16, 1);
            RETURN;
        END

        IF NOT EXISTS (
            SELECT 1 FROM dbo.TB_Bien
            WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0
        )
        BEGIN
            RAISERROR('El bien no existe o está eliminado.', 16, 1);
            RETURN;
        END

        SET @FechaSalida = ISNULL(@FechaFin, GETDATE());

        BEGIN TRANSACTION;

        UPDATE dbo.TB_Mantenimiento
        SET FechaFin          = @FechaSalida,
            TrabajoRealizado  = @TrabajoRealizado,
            Costo             = @Costo,
            Observaciones     = ISNULL(@Observaciones, Observaciones),
            Estado            = 'FINALIZADO'
        WHERE IdMantenimiento = @IdMantenimiento;

        UPDATE dbo.TB_Bien
        SET IdEstado = 2
        WHERE IdBien = @IdBien;

        INSERT INTO dbo.TB_HistorialEstadoBien
            (IdBien, EstadoAnterior, EstadoNuevo, Motivo, FechaCambio, UsuarioCambio)
        VALUES
            (@IdBien, 4, 2, 'Salida de mantenimiento', GETDATE(), @IdUsuario);

        INSERT INTO dbo.TB_Movimiento
            (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
        VALUES
            (6, GETDATE(), @IdUsuario,
             ISNULL(@TrabajoRealizado, 'Finalización de mantenimiento'), 'REGISTRADO');

        SET @IdMovimiento = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_MovimientoDetalle
            (IdMovimiento, IdBien, EstadoAntes, EstadoDespues)
        VALUES
            (@IdMovimiento, @IdBien, 4, 2);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        IdMantenimiento = @IdMantenimiento,
        IdMovimiento    = @IdMovimiento,
        CodigoMovimiento = M.CodigoMovimiento,
        FechaFin        = @FechaSalida,
        Estado          = 'FINALIZADO'
    FROM dbo.TB_Movimiento M
    WHERE M.IdMovimiento = @IdMovimiento;
END
GO

/* ===========================================================================
   5) SP_LISTARMANTENIMIENTOS
   Result sets: 1) datos paginados  2) Total
   =========================================================================== */
IF OBJECT_ID('dbo.SP_ListarMantenimientos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarMantenimientos;
GO

CREATE PROCEDURE dbo.SP_ListarMantenimientos
    @Filtro  VARCHAR(50) = NULL,
    @IdBien  INT = NULL,
    @Estado  VARCHAR(50) = NULL,
    @Pagina  INT = 1,
    @Filas   INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @FiltroPatron VARCHAR(52) = '%' + ISNULL(@Filtro, '') + '%';

    SELECT
        M.IdMantenimiento,
        B.IdBien,
        B.CodigoInterno,
        B.CodigoPatrimonial,
        A.NombreArticulo,
        M.TipoMantenimiento,
        M.FechaInicio,
        M.FechaFin,
        M.Diagnostico,
        M.TrabajoRealizado,
        M.Costo,
        M.Responsable,
        M.Observaciones,
        M.Estado,
        COUNT(R.IdMantenimientoRepuesto) AS TotalRepuestos,
        ISNULL(SUM(R.Cantidad * R.CostoUnitario), 0) AS CostoRepuestos
    FROM dbo.TB_Mantenimiento M
    JOIN dbo.TB_Bien B        ON B.IdBien = M.IdBien
    JOIN dbo.TB_Articulo A    ON A.IdArticulo = B.IdArticulo
    LEFT JOIN dbo.TB_MantenimientoRepuesto R ON R.IdMantenimiento = M.IdMantenimiento
    WHERE (@IdBien IS NULL OR M.IdBien = @IdBien)
      AND (@Estado IS NULL OR M.Estado = @Estado)
      AND (@Filtro IS NULL
           OR B.CodigoInterno LIKE @FiltroPatron
           OR B.CodigoPatrimonial LIKE @FiltroPatron
           OR A.NombreArticulo LIKE @FiltroPatron
           OR M.TipoMantenimiento LIKE @FiltroPatron)
    GROUP BY M.IdMantenimiento, B.IdBien, B.CodigoInterno, B.CodigoPatrimonial,
             A.NombreArticulo, M.TipoMantenimiento, M.FechaInicio, M.FechaFin,
             M.Diagnostico, M.TrabajoRealizado, M.Costo, M.Responsable,
             M.Observaciones, M.Estado
    ORDER BY M.IdMantenimiento DESC
    OFFSET ((@Pagina - 1) * @Filas) ROWS FETCH NEXT @Filas ROWS ONLY;

    SELECT COUNT(*) AS Total
    FROM dbo.TB_Mantenimiento M
    JOIN dbo.TB_Bien B        ON B.IdBien = M.IdBien
    JOIN dbo.TB_Articulo A    ON A.IdArticulo = B.IdArticulo
    WHERE (@IdBien IS NULL OR M.IdBien = @IdBien)
      AND (@Estado IS NULL OR M.Estado = @Estado)
      AND (@Filtro IS NULL
           OR B.CodigoInterno LIKE @FiltroPatron
           OR B.CodigoPatrimonial LIKE @FiltroPatron
           OR A.NombreArticulo LIKE @FiltroPatron
           OR M.TipoMantenimiento LIKE @FiltroPatron);
END
GO

/* ===========================================================================
   6) SP_OBTENERMANTENIMIENTO
   Result sets: 1) cabecera (ficha)  2) repuestos
   =========================================================================== */
IF OBJECT_ID('dbo.SP_ObtenerMantenimiento', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ObtenerMantenimiento;
GO

CREATE PROCEDURE dbo.SP_ObtenerMantenimiento
    @IdMantenimiento INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.TB_Mantenimiento
        WHERE IdMantenimiento = @IdMantenimiento
    )
    BEGIN
        RAISERROR('El mantenimiento no existe.', 16, 1);
        RETURN;
    END

    SELECT
        M.IdMantenimiento,
        M.IdBien,
        B.CodigoInterno,
        B.CodigoPatrimonial,
        B.NumeroSerie,
        A.IdArticulo,
        A.CodigoArticulo,
        A.NombreArticulo,
        M.TipoMantenimiento,
        M.FechaInicio,
        M.FechaFin,
        M.Diagnostico,
        M.TrabajoRealizado,
        M.Costo,
        M.Responsable,
        M.Observaciones,
        M.Estado,
        B.IdEstado,
        EST.NombreEstado,
        B.IdUbicacion,
        UB.NombreUbicacion,
        B.IdResponsableActual,
        BO.CodigoBombero AS CodigoResponsableActual,
        (BO.Nombres + ' ' + BO.Apellidos) AS ResponsableActual,
        ISNULL(SUM(R.Cantidad * R.CostoUnitario), 0) AS CostoRepuestos
    FROM dbo.TB_Mantenimiento M
    JOIN dbo.TB_Bien B        ON B.IdBien = M.IdBien
    JOIN dbo.TB_Articulo A    ON A.IdArticulo = B.IdArticulo
    JOIN dbo.TB_EstadoBien EST ON EST.IdEstado = B.IdEstado
    LEFT JOIN dbo.TB_Ubicacion UB ON UB.IdUbicacion = B.IdUbicacion
    LEFT JOIN dbo.TB_Bombero BO ON BO.IdBombero = B.IdResponsableActual
    LEFT JOIN dbo.TB_MantenimientoRepuesto R ON R.IdMantenimiento = M.IdMantenimiento
    WHERE M.IdMantenimiento = @IdMantenimiento
    GROUP BY M.IdMantenimiento, M.IdBien, B.CodigoInterno, B.CodigoPatrimonial,
             B.NumeroSerie, A.IdArticulo, A.CodigoArticulo, A.NombreArticulo,
             M.TipoMantenimiento, M.FechaInicio, M.FechaFin, M.Diagnostico,
             M.TrabajoRealizado, M.Costo, M.Responsable, M.Observaciones, M.Estado,
             B.IdEstado, EST.NombreEstado, B.IdUbicacion, UB.NombreUbicacion,
             B.IdResponsableActual, BO.CodigoBombero, BO.Nombres, BO.Apellidos;

    SELECT
        IdMantenimientoRepuesto,
        NombreRepuesto,
        Cantidad,
        CostoUnitario,
        (Cantidad * CostoUnitario) AS Total
    FROM dbo.TB_MantenimientoRepuesto
    WHERE IdMantenimiento = @IdMantenimiento
    ORDER BY IdMantenimientoRepuesto;
END
GO

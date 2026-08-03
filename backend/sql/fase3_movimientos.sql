/* ============================================================
   FASE 3 - MOVIMIENTOS / KARDEX / PRESTAMOS / DEVOLUCIONES
   Archivo: fase3_movimientos.sql
   - Indices nuevos (IF NOT EXISTS, sin tocar los existentes)
   - Nuevos SP transaccionales (legacy intacto)
   - Triggers existentes (codigos MOV/PRE y Kardex) se mantienen
   ============================================================ */
SET NOCOUNT ON;
GO

/* ============================================================
   1. INDICES (validados contra estructura real)
   ============================================================ */

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_MovimientoDetalle_IdMovimiento'
      AND object_id = OBJECT_ID('dbo.TB_MovimientoDetalle')
)
    CREATE NONCLUSTERED INDEX IX_MovimientoDetalle_IdMovimiento
        ON dbo.TB_MovimientoDetalle (IdMovimiento);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_MovimientoDetalle_IdBien'
      AND object_id = OBJECT_ID('dbo.TB_MovimientoDetalle')
)
    CREATE NONCLUSTERED INDEX IX_MovimientoDetalle_IdBien
        ON dbo.TB_MovimientoDetalle (IdBien);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_PrestamoDetalle_IdPrestamo'
      AND object_id = OBJECT_ID('dbo.TB_PrestamoDetalle')
)
    CREATE NONCLUSTERED INDEX IX_PrestamoDetalle_IdPrestamo
        ON dbo.TB_PrestamoDetalle (IdPrestamo);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_HistorialEstadoBien_IdBien'
      AND object_id = OBJECT_ID('dbo.TB_HistorialEstadoBien')
)
    CREATE NONCLUSTERED INDEX IX_HistorialEstadoBien_IdBien
        ON dbo.TB_HistorialEstadoBien (IdBien);
GO

/* ============================================================
   2. SP_ListarMovimientos
   Lista de movimientos con detalle y nombres de catalogo.
   ============================================================ */
IF OBJECT_ID('dbo.SP_ListarMovimientos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarMovimientos;
GO
CREATE PROCEDURE dbo.SP_ListarMovimientos
    @Filtro VARCHAR(100) = NULL,
    @IdTipoMovimiento INT = NULL,
    @IdBien INT = NULL,
    @Pagina INT = 1,
    @Filas INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Pagina - 1) * @Filas;

    SELECT M.IdMovimiento, M.CodigoMovimiento,
           M.IdTipoMovimiento, TM.NombreMovimiento AS TipoMovimiento,
           M.FechaMovimiento, M.Estado, M.Observacion,
           M.IdUsuario, U.Usuario AS UsuarioRegistro,
           D.IdBien, B.CodigoInterno,
           D.EstadoAntes, EST_ANT.NombreEstado AS EstadoAntesNombre,
           D.EstadoDespues, EST_DES.NombreEstado AS EstadoDespuesNombre,
           D.UbicacionAntes, UB_ANT.NombreUbicacion AS UbicacionAntesNombre,
           D.UbicacionDespues, UB_DES.NombreUbicacion AS UbicacionDespuesNombre,
           D.ResponsableAntes, BOM_ANT.Nombres + ' ' + BOM_ANT.Apellidos AS ResponsableAntesNombre,
           D.ResponsableDespues, BOM_DES.Nombres + ' ' + BOM_DES.Apellidos AS ResponsableDespuesNombre
    FROM dbo.TB_Movimiento M
    JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    LEFT JOIN dbo.TB_Usuario U ON U.IdUsuario = M.IdUsuario
    LEFT JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
    LEFT JOIN dbo.TB_Bien B ON B.IdBien = D.IdBien
    LEFT JOIN dbo.TB_EstadoBien EST_ANT ON EST_ANT.IdEstado = D.EstadoAntes
    LEFT JOIN dbo.TB_EstadoBien EST_DES ON EST_DES.IdEstado = D.EstadoDespues
    LEFT JOIN dbo.TB_Ubicacion UB_ANT ON UB_ANT.IdUbicacion = D.UbicacionAntes
    LEFT JOIN dbo.TB_Ubicacion UB_DES ON UB_DES.IdUbicacion = D.UbicacionDespues
    LEFT JOIN dbo.TB_Bombero BOM_ANT ON BOM_ANT.IdBombero = D.ResponsableAntes
    LEFT JOIN dbo.TB_Bombero BOM_DES ON BOM_DES.IdBombero = D.ResponsableDespues
    WHERE (@Filtro IS NULL
           OR M.CodigoMovimiento LIKE '%' + @Filtro + '%'
           OR TM.NombreMovimiento LIKE '%' + @Filtro + '%'
           OR B.CodigoInterno LIKE '%' + @Filtro + '%')
      AND (@IdTipoMovimiento IS NULL OR M.IdTipoMovimiento = @IdTipoMovimiento)
      AND (@IdBien IS NULL OR D.IdBien = @IdBien)
    ORDER BY M.IdMovimiento DESC
    OFFSET @Offset ROWS FETCH NEXT @Filas ROWS ONLY;

    SELECT COUNT(*) AS Total
    FROM dbo.TB_Movimiento M
    JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    LEFT JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
    LEFT JOIN dbo.TB_Bien B ON B.IdBien = D.IdBien
    WHERE (@Filtro IS NULL
           OR M.CodigoMovimiento LIKE '%' + @Filtro + '%'
           OR TM.NombreMovimiento LIKE '%' + @Filtro + '%'
           OR B.CodigoInterno LIKE '%' + @Filtro + '%')
      AND (@IdTipoMovimiento IS NULL OR M.IdTipoMovimiento = @IdTipoMovimiento)
      AND (@IdBien IS NULL OR D.IdBien = @IdBien);
END;
GO

/* ============================================================
   3. SP_ObtenerMovimiento
   Cabecera + detalle enriquecido de un movimiento.
   ============================================================ */
IF OBJECT_ID('dbo.SP_ObtenerMovimiento', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ObtenerMovimiento;
GO
CREATE PROCEDURE dbo.SP_ObtenerMovimiento
    @IdMovimiento INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovimiento)
    BEGIN
        RAISERROR('El movimiento no existe.', 16, 1);
        RETURN;
    END

    SELECT M.IdMovimiento, M.CodigoMovimiento,
           M.IdTipoMovimiento, TM.NombreMovimiento AS TipoMovimiento,
           M.FechaMovimiento, M.Estado, M.Observacion,
           M.IdUsuario, U.Usuario AS UsuarioRegistro
    FROM dbo.TB_Movimiento M
    JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    LEFT JOIN dbo.TB_Usuario U ON U.IdUsuario = M.IdUsuario
    WHERE M.IdMovimiento = @IdMovimiento;

    SELECT D.IdDetalleMovimiento, D.IdBien, B.CodigoInterno,
           D.EstadoAntes, EST_ANT.NombreEstado AS EstadoAntesNombre,
           D.EstadoDespues, EST_DES.NombreEstado AS EstadoDespuesNombre,
           D.UbicacionAntes, UB_ANT.NombreUbicacion AS UbicacionAntesNombre,
           D.UbicacionDespues, UB_DES.NombreUbicacion AS UbicacionDespuesNombre,
           D.ResponsableAntes, BOM_ANT.Nombres + ' ' + BOM_ANT.Apellidos AS ResponsableAntesNombre,
           D.ResponsableDespues, BOM_DES.Nombres + ' ' + BOM_DES.Apellidos AS ResponsableDespuesNombre
    FROM dbo.TB_MovimientoDetalle D
    JOIN dbo.TB_Bien B ON B.IdBien = D.IdBien
    LEFT JOIN dbo.TB_EstadoBien EST_ANT ON EST_ANT.IdEstado = D.EstadoAntes
    LEFT JOIN dbo.TB_EstadoBien EST_DES ON EST_DES.IdEstado = D.EstadoDespues
    LEFT JOIN dbo.TB_Ubicacion UB_ANT ON UB_ANT.IdUbicacion = D.UbicacionAntes
    LEFT JOIN dbo.TB_Ubicacion UB_DES ON UB_DES.IdUbicacion = D.UbicacionDespues
    LEFT JOIN dbo.TB_Bombero BOM_ANT ON BOM_ANT.IdBombero = D.ResponsableAntes
    LEFT JOIN dbo.TB_Bombero BOM_DES ON BOM_DES.IdBombero = D.ResponsableDespues
    WHERE D.IdMovimiento = @IdMovimiento;
END;
GO

/* ============================================================
   4. SP_ObtenerKardexBien
   Trazabilidad enriquecida por bien (codigo B21):
   Fecha, Tipo, Bien, Estado/Ubicacion/Responsable antes-despues,
   Usuario, Observacion. Kardex lo alimenta el trigger.
   ============================================================ */
IF OBJECT_ID('dbo.SP_ObtenerKardexBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ObtenerKardexBien;
GO
CREATE PROCEDURE dbo.SP_ObtenerKardexBien
    @CodigoInterno VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IdBien INT;

    SELECT @IdBien = IdBien
    FROM dbo.TB_Bien
    WHERE CodigoInterno = @CodigoInterno;

    IF @IdBien IS NULL
    BEGIN
        RAISERROR('El bien no existe.', 16, 1);
        RETURN;
    END

    SELECT K.IdKardex, K.IdBien, B.CodigoInterno, K.Fecha,
           TM.NombreMovimiento AS TipoMovimiento,
           M.CodigoMovimiento, K.IdMovimiento,
           EST_ANT.NombreEstado AS EstadoAnterior,
           EST_DES.NombreEstado AS EstadoNuevo,
           UB_ANT.NombreUbicacion AS UbicacionAnterior,
           UB_DES.NombreUbicacion AS UbicacionNueva,
           BOM_ANT.Nombres + ' ' + BOM_ANT.Apellidos AS ResponsableAnterior,
           BOM_DES.Nombres + ' ' + BOM_DES.Apellidos AS ResponsableNuevo,
           U.Usuario AS Usuario,
           M.Observacion,
           K.Detalle
    FROM dbo.TB_Kardex K
    JOIN dbo.TB_Bien B ON B.IdBien = K.IdBien
    JOIN dbo.TB_Movimiento M ON M.IdMovimiento = K.IdMovimiento
    JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    LEFT JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
    LEFT JOIN dbo.TB_EstadoBien EST_ANT ON EST_ANT.IdEstado = D.EstadoAntes
    LEFT JOIN dbo.TB_EstadoBien EST_DES ON EST_DES.IdEstado = D.EstadoDespues
    LEFT JOIN dbo.TB_Ubicacion UB_ANT ON UB_ANT.IdUbicacion = D.UbicacionAntes
    LEFT JOIN dbo.TB_Ubicacion UB_DES ON UB_DES.IdUbicacion = D.UbicacionDespues
    LEFT JOIN dbo.TB_Bombero BOM_ANT ON BOM_ANT.IdBombero = D.ResponsableAntes
    LEFT JOIN dbo.TB_Bombero BOM_DES ON BOM_DES.IdBombero = D.ResponsableDespues
    LEFT JOIN dbo.TB_Usuario U ON U.IdUsuario = M.IdUsuario
    WHERE K.IdBien = @IdBien
    ORDER BY K.Fecha DESC, K.IdKardex DESC;
END;
GO

/* ============================================================
   5. SP_RegistrarMovimientoV2
   Movimiento generico (Ingreso/Salida/Mantenimiento/Baja/Ajuste).
   Transaccion completa: movimiento + detalle (antes/despues) +
   actualizacion TB_Bien + historial de estado + historial de
   asignacion. El Kardex lo genera TR_GenerarKardexMovimiento.
   ============================================================ */
IF OBJECT_ID('dbo.SP_RegistrarMovimientoV2', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarMovimientoV2;
GO
CREATE PROCEDURE dbo.SP_RegistrarMovimientoV2
    @IdTipoMovimiento INT,
    @IdBien INT,
    @IdUsuario INT,
    @IdEstadoNuevo INT = NULL,
    @IdUbicacionNueva INT = NULL,
    @IdResponsableNuevo INT = NULL,
    @Observacion VARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdMovimiento INT;
    DECLARE @IdEstadoAnterior INT;
    DECLARE @IdUbicacionAnterior INT;
    DECLARE @IdResponsableAnterior INT;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0)
    BEGIN
        RAISERROR('El bien no existe o está eliminado.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_TipoMovimiento WHERE IdTipoMovimiento = @IdTipoMovimiento)
    BEGIN
        RAISERROR('El tipo de movimiento no es válido.', 16, 1);
        RETURN;
    END

    IF @IdEstadoNuevo IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_EstadoBien WHERE IdEstado = @IdEstadoNuevo)
    BEGIN
        RAISERROR('El estado no es válido.', 16, 1);
        RETURN;
    END

    IF @IdUbicacionNueva IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_Ubicacion WHERE IdUbicacion = @IdUbicacionNueva)
    BEGIN
        RAISERROR('La ubicación no es válida.', 16, 1);
        RETURN;
    END

    IF @IdResponsableNuevo IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero WHERE IdBombero = @IdResponsableNuevo AND ISNULL(Estado, 1) = 1)
    BEGIN
        RAISERROR('El bombero no existe o está inactivo.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @IdEstadoAnterior = IdEstado,
               @IdUbicacionAnterior = IdUbicacion,
               @IdResponsableAnterior = IdResponsableActual
        FROM dbo.TB_Bien
        WHERE IdBien = @IdBien;

        INSERT INTO dbo.TB_Movimiento
            (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
        VALUES
            (@IdTipoMovimiento, GETDATE(), @IdUsuario, @Observacion, 'REGISTRADO');

        SET @IdMovimiento = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_MovimientoDetalle
            (IdMovimiento, IdBien, EstadoAntes, EstadoDespues,
             UbicacionAntes, UbicacionDespues, ResponsableAntes, ResponsableDespues)
        VALUES
            (@IdMovimiento, @IdBien,
             @IdEstadoAnterior, @IdEstadoNuevo,
             @IdUbicacionAnterior, @IdUbicacionNueva,
             @IdResponsableAnterior, @IdResponsableNuevo);

        IF @IdEstadoNuevo IS NOT NULL
        BEGIN
            UPDATE dbo.TB_Bien
            SET IdEstado = @IdEstadoNuevo
            WHERE IdBien = @IdBien;

            INSERT INTO dbo.TB_HistorialEstadoBien
                (IdBien, EstadoAnterior, EstadoNuevo, Motivo, FechaCambio, UsuarioCambio)
            VALUES
                (@IdBien, @IdEstadoAnterior, @IdEstadoNuevo,
                 ISNULL(@Observacion, 'Cambio de estado'), GETDATE(), @IdUsuario);
        END

        IF @IdUbicacionNueva IS NOT NULL
        BEGIN
            UPDATE dbo.TB_Bien
            SET IdUbicacion = @IdUbicacionNueva
            WHERE IdBien = @IdBien;
        END

        IF @IdResponsableNuevo IS NOT NULL
        BEGIN
            UPDATE dbo.TB_HistorialAsignacion
            SET FechaFin = GETDATE()
            WHERE IdBien = @IdBien AND FechaFin IS NULL;

            INSERT INTO dbo.TB_HistorialAsignacion
                (IdBien, IdBombero, FechaAsignacion, Motivo)
            VALUES
                (@IdBien, @IdResponsableNuevo, GETDATE(),
                 ISNULL(@Observacion, 'Asignación de responsable'));

            UPDATE dbo.TB_Bien
            SET IdResponsableActual = @IdResponsableNuevo
            WHERE IdBien = @IdBien;
        END

        COMMIT TRANSACTION;

        SELECT @IdMovimiento AS IdMovimiento;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ============================================================
   6. SP_RegistrarPrestamo
   Transaccion completa: TB_Prestamo + TB_PrestamoDetalle +
   MOV tipo Prestamo + TB_Bien (Prestado por nombre, sin valores
   fijos) + cierre/insercion de TB_HistorialAsignacion.
   Kardex automatico via trigger.
   ============================================================ */
IF OBJECT_ID('dbo.SP_RegistrarPrestamo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarPrestamo;
GO
CREATE PROCEDURE dbo.SP_RegistrarPrestamo
    @IdBien INT,
    @IdBomberoSolicitante INT,
    @IdBomberoAutoriza INT = NULL,
    @FechaDevolucionProgramada DATETIME = NULL,
    @Observacion VARCHAR(MAX) = NULL,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdPrestamo INT;
    DECLARE @IdMovimiento INT;
    DECLARE @IdEstadoPrestado INT;
    DECLARE @IdTipoPrestamo INT;
    DECLARE @IdEstadoAnterior INT;
    DECLARE @IdUbicacionAnterior INT;
    DECLARE @IdResponsableAnterior INT;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0)
    BEGIN
        RAISERROR('El bien no existe o está eliminado.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero WHERE IdBombero = @IdBomberoSolicitante AND ISNULL(Estado, 1) = 1)
    BEGIN
        RAISERROR('El bombero solicitante no existe o está inactivo.', 16, 1);
        RETURN;
    END

    IF @IdBomberoAutoriza IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero WHERE IdBombero = @IdBomberoAutoriza AND ISNULL(Estado, 1) = 1)
    BEGIN
        RAISERROR('El bombero autorizador no existe o está inactivo.', 16, 1);
        RETURN;
    END

    SELECT @IdEstadoPrestado = IdEstado
    FROM dbo.TB_EstadoBien
    WHERE NombreEstado = 'Prestado';

    IF @IdEstadoPrestado IS NULL
    BEGIN
        RAISERROR('El estado Prestado no está configurado.', 16, 1);
        RETURN;
    END

    SELECT @IdTipoPrestamo = IdTipoMovimiento
    FROM dbo.TB_TipoMovimiento
    WHERE NombreMovimiento = 'Prestamo';

    IF @IdTipoPrestamo IS NULL
    BEGIN
        RAISERROR('El tipo de movimiento Prestamo no está configurado.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @IdEstadoAnterior = IdEstado,
               @IdUbicacionAnterior = IdUbicacion,
               @IdResponsableAnterior = IdResponsableActual
        FROM dbo.TB_Bien
        WHERE IdBien = @IdBien;

        INSERT INTO dbo.TB_Prestamo
            (CodigoPrestamo, FechaSalida, FechaDevolucionProgramada,
             IdBomberoSolicitante, IdBomberoAutoriza, Estado, Observacion)
        VALUES
            (NULL, GETDATE(), @FechaDevolucionProgramada,
             @IdBomberoSolicitante, @IdBomberoAutoriza, 'PRESTADO', @Observacion);

        SET @IdPrestamo = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_PrestamoDetalle (IdPrestamo, IdBien, EstadoSalida)
        SELECT @IdPrestamo, @IdBien, E.NombreEstado
        FROM dbo.TB_EstadoBien E
        WHERE E.IdEstado = @IdEstadoAnterior;

        INSERT INTO dbo.TB_Movimiento
            (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
        VALUES
            (@IdTipoPrestamo, GETDATE(), @IdUsuario,
             ISNULL(@Observacion, 'Préstamo de equipo'), 'REGISTRADO');

        SET @IdMovimiento = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_MovimientoDetalle
            (IdMovimiento, IdBien, EstadoAntes, EstadoDespues,
             UbicacionAntes, UbicacionDespues, ResponsableAntes, ResponsableDespues)
        VALUES
            (@IdMovimiento, @IdBien,
             @IdEstadoAnterior, @IdEstadoPrestado,
             @IdUbicacionAnterior, @IdUbicacionAnterior,
             @IdResponsableAnterior, @IdBomberoSolicitante);

        UPDATE dbo.TB_HistorialAsignacion
        SET FechaFin = GETDATE()
        WHERE IdBien = @IdBien AND FechaFin IS NULL;

        INSERT INTO dbo.TB_HistorialAsignacion
            (IdBien, IdBombero, FechaAsignacion, Motivo)
        VALUES
            (@IdBien, @IdBomberoSolicitante, GETDATE(),
             ISNULL(@Observacion, 'Préstamo de equipo'));

        UPDATE dbo.TB_Bien
        SET IdResponsableActual = @IdBomberoSolicitante,
            IdEstado = @IdEstadoPrestado
        WHERE IdBien = @IdBien;

        COMMIT TRANSACTION;

        SELECT @IdPrestamo AS IdPrestamo, @IdMovimiento AS IdMovimiento;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ============================================================
   7. SP_RegistrarDevolucionV2
   Cierra el prestamo (Estado = DEVUELTO), registra TB_Devolucion,
   MOV tipo Devolucion, actualiza TB_Bien (estado de retorno y
   responsable: nunca restaura el anterior automaticamente) y
   cierra la asignacion activa. Transaccion completa.
   ============================================================ */
IF OBJECT_ID('dbo.SP_RegistrarDevolucionV2', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarDevolucionV2;
GO
CREATE PROCEDURE dbo.SP_RegistrarDevolucionV2
    @IdPrestamo INT,
    @IdEstadoRetorno INT,
    @Observacion VARCHAR(MAX) = NULL,
    @IdBomberoRecibe INT,
    @IdResponsableNuevo INT = NULL,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdMovimiento INT;
    DECLARE @IdTipoDevolucion INT;
    DECLARE @NombreEstadoRetorno VARCHAR(50);

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamo)
    BEGIN
        RAISERROR('El préstamo no existe.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamo AND Estado = 'PRESTADO')
    BEGIN
        RAISERROR('El préstamo ya fue devuelto.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_EstadoBien WHERE IdEstado = @IdEstadoRetorno)
    BEGIN
        RAISERROR('El estado no es válido.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero WHERE IdBombero = @IdBomberoRecibe AND ISNULL(Estado, 1) = 1)
    BEGIN
        RAISERROR('El bombero que recibe no existe o está inactivo.', 16, 1);
        RETURN;
    END

    IF @IdResponsableNuevo IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero WHERE IdBombero = @IdResponsableNuevo AND ISNULL(Estado, 1) = 1)
    BEGIN
        RAISERROR('El nuevo responsable no existe o está inactivo.', 16, 1);
        RETURN;
    END

    SELECT @IdTipoDevolucion = IdTipoMovimiento
    FROM dbo.TB_TipoMovimiento
    WHERE NombreMovimiento = 'Devolucion';

    IF @IdTipoDevolucion IS NULL
    BEGIN
        RAISERROR('El tipo de movimiento Devolucion no está configurado.', 16, 1);
        RETURN;
    END

    SELECT @NombreEstadoRetorno = NombreEstado
    FROM dbo.TB_EstadoBien
    WHERE IdEstado = @IdEstadoRetorno;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.TB_Devolucion
            (IdPrestamo, FechaDevolucion, IdBomberoRecibe, EstadoRecepcion, Observacion)
        VALUES
            (@IdPrestamo, GETDATE(), @IdBomberoRecibe, @NombreEstadoRetorno, @Observacion);

        UPDATE dbo.TB_Prestamo
        SET FechaDevolucionReal = GETDATE(),
            Estado = 'DEVUELTO'
        WHERE IdPrestamo = @IdPrestamo;

        INSERT INTO dbo.TB_Movimiento
            (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
        VALUES
            (@IdTipoDevolucion, GETDATE(), @IdUsuario,
             ISNULL(@Observacion, 'Devolución de préstamo'), 'REGISTRADO');

        SET @IdMovimiento = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_MovimientoDetalle
            (IdMovimiento, IdBien, EstadoAntes, EstadoDespues,
             UbicacionAntes, UbicacionDespues, ResponsableAntes, ResponsableDespues)
        SELECT @IdMovimiento, PD.IdBien, B.IdEstado, @IdEstadoRetorno,
               B.IdUbicacion, B.IdUbicacion,
               B.IdResponsableActual, @IdResponsableNuevo
        FROM dbo.TB_PrestamoDetalle PD
        JOIN dbo.TB_Bien B ON B.IdBien = PD.IdBien
        WHERE PD.IdPrestamo = @IdPrestamo;

        INSERT INTO dbo.TB_HistorialEstadoBien
            (IdBien, EstadoAnterior, EstadoNuevo, Motivo, FechaCambio, UsuarioCambio)
        SELECT PD.IdBien, B.IdEstado, @IdEstadoRetorno,
               ISNULL(@Observacion, 'Devolución de préstamo'), GETDATE(), @IdUsuario
        FROM dbo.TB_PrestamoDetalle PD
        JOIN dbo.TB_Bien B ON B.IdBien = PD.IdBien
        WHERE PD.IdPrestamo = @IdPrestamo;

        UPDATE dbo.TB_HistorialAsignacion
        SET FechaFin = GETDATE()
        WHERE IdBien IN (SELECT IdBien FROM dbo.TB_PrestamoDetalle WHERE IdPrestamo = @IdPrestamo)
          AND FechaFin IS NULL;

        IF @IdResponsableNuevo IS NOT NULL
        BEGIN
            INSERT INTO dbo.TB_HistorialAsignacion
                (IdBien, IdBombero, FechaAsignacion, Motivo)
            SELECT PD.IdBien, @IdResponsableNuevo, GETDATE(),
                   ISNULL(@Observacion, 'Devolución recibida')
            FROM dbo.TB_PrestamoDetalle PD
            WHERE PD.IdPrestamo = @IdPrestamo;
        END

        UPDATE dbo.TB_Bien
        SET IdEstado = @IdEstadoRetorno,
            IdResponsableActual = @IdResponsableNuevo
        WHERE IdBien IN (SELECT IdBien FROM dbo.TB_PrestamoDetalle WHERE IdPrestamo = @IdPrestamo);

        COMMIT TRANSACTION;

        SELECT @IdPrestamo AS IdPrestamo, @IdMovimiento AS IdMovimiento;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ============================================================
   8. SP_TransferirBien
   Movimiento tipo Transferencia (ubicacion y/o responsable).
   Actualiza TB_Bien y el historial de asignacion si corresponde.
   Transaccion completa.
   ============================================================ */
IF OBJECT_ID('dbo.SP_TransferirBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_TransferirBien;
GO
CREATE PROCEDURE dbo.SP_TransferirBien
    @IdBien INT,
    @IdNuevaUbicacion INT,
    @IdNuevoResponsable INT = NULL,
    @IdUsuario INT,
    @Motivo VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdMovimiento INT;
    DECLARE @IdTipoTransferencia INT;
    DECLARE @IdEstadoActual INT;
    DECLARE @IdUbicacionAnterior INT;
    DECLARE @IdResponsableAnterior INT;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = @IdBien AND ISNULL(Eliminado, 0) = 0)
    BEGIN
        RAISERROR('El bien no existe o está eliminado.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Ubicacion WHERE IdUbicacion = @IdNuevaUbicacion)
    BEGIN
        RAISERROR('La ubicación no es válida.', 16, 1);
        RETURN;
    END

    IF @IdNuevoResponsable IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero WHERE IdBombero = @IdNuevoResponsable AND ISNULL(Estado, 1) = 1)
    BEGIN
        RAISERROR('El nuevo responsable no existe o está inactivo.', 16, 1);
        RETURN;
    END

    SELECT @IdTipoTransferencia = IdTipoMovimiento
    FROM dbo.TB_TipoMovimiento
    WHERE NombreMovimiento = 'Transferencia';

    IF @IdTipoTransferencia IS NULL
    BEGIN
        RAISERROR('El tipo de movimiento Transferencia no está configurado.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @IdEstadoActual = IdEstado,
               @IdUbicacionAnterior = IdUbicacion,
               @IdResponsableAnterior = IdResponsableActual
        FROM dbo.TB_Bien
        WHERE IdBien = @IdBien;

        INSERT INTO dbo.TB_Movimiento
            (IdTipoMovimiento, FechaMovimiento, IdUsuario, Observacion, Estado)
        VALUES
            (@IdTipoTransferencia, GETDATE(), @IdUsuario,
             ISNULL(@Motivo, 'Transferencia'), 'REGISTRADO');

        SET @IdMovimiento = SCOPE_IDENTITY();

        INSERT INTO dbo.TB_MovimientoDetalle
            (IdMovimiento, IdBien, EstadoAntes, EstadoDespues,
             UbicacionAntes, UbicacionDespues, ResponsableAntes, ResponsableDespues)
        VALUES
            (@IdMovimiento, @IdBien,
             @IdEstadoActual, @IdEstadoActual,
             @IdUbicacionAnterior, @IdNuevaUbicacion,
             @IdResponsableAnterior, @IdNuevoResponsable);

        UPDATE dbo.TB_Bien
        SET IdUbicacion = @IdNuevaUbicacion
        WHERE IdBien = @IdBien;

        IF @IdNuevoResponsable IS NOT NULL
        BEGIN
            UPDATE dbo.TB_HistorialAsignacion
            SET FechaFin = GETDATE()
            WHERE IdBien = @IdBien AND FechaFin IS NULL;

            INSERT INTO dbo.TB_HistorialAsignacion
                (IdBien, IdBombero, FechaAsignacion, Motivo)
            VALUES
                (@IdBien, @IdNuevoResponsable, GETDATE(),
                 ISNULL(@Motivo, 'Transferencia de responsable'));

            UPDATE dbo.TB_Bien
            SET IdResponsableActual = @IdNuevoResponsable
            WHERE IdBien = @IdBien;
        END

        COMMIT TRANSACTION;

        SELECT @IdMovimiento AS IdMovimiento;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

PRINT 'FASE 3 - Script fase3_movimientos.sql ejecutado correctamente.';
GO

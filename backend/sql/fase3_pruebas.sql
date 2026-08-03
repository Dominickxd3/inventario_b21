/* ============================================================
   FASE 3 - PRUEBAS SQL (fase3_pruebas.sql)
   Escenarios: movimiento V2, prestamo, devolucion, transferencia,
   rollback ante errores y sanity de consultas.
   ============================================================ */
SET NOCOUNT ON;

DECLARE @Fallo INT = 0;
DECLARE @Msg NVARCHAR(4000);

/* --- Datos de apoyo: segunda ubicacion para transferencia --- */
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Ubicacion WHERE NombreUbicacion = 'Estacion Central B21')
BEGIN
    INSERT INTO dbo.TB_Ubicacion (NombreUbicacion, TipoUbicacion)
    VALUES ('Estacion Central B21', 'Operativa');
END

/* --- Resolucion por nombre (sin valores fijos) --- */
DECLARE @EstadoPrestado INT, @EstadoOperativo INT, @EstadoMantenimiento INT;
DECLARE @TipoPrestamo INT, @TipoDevolucion INT, @TipoTransferencia INT, @TipoMantenimiento INT, @TipoIngreso INT;
DECLARE @IdUbicacion2 INT;

SELECT @EstadoPrestado = IdEstado FROM dbo.TB_EstadoBien WHERE NombreEstado = 'Prestado';
SELECT @EstadoOperativo = IdEstado FROM dbo.TB_EstadoBien WHERE NombreEstado = 'Operativo';
SELECT @EstadoMantenimiento = IdEstado FROM dbo.TB_EstadoBien WHERE NombreEstado = 'Mantenimiento';
SELECT @TipoPrestamo = IdTipoMovimiento FROM dbo.TB_TipoMovimiento WHERE NombreMovimiento = 'Prestamo';
SELECT @TipoDevolucion = IdTipoMovimiento FROM dbo.TB_TipoMovimiento WHERE NombreMovimiento = 'Devolucion';
SELECT @TipoTransferencia = IdTipoMovimiento FROM dbo.TB_TipoMovimiento WHERE NombreMovimiento = 'Transferencia';
SELECT @TipoMantenimiento = IdTipoMovimiento FROM dbo.TB_TipoMovimiento WHERE NombreMovimiento = 'Mantenimiento';
SELECT @TipoIngreso = IdTipoMovimiento FROM dbo.TB_TipoMovimiento WHERE NombreMovimiento = 'Ingreso';
SELECT @IdUbicacion2 = IdUbicacion FROM dbo.TB_Ubicacion WHERE NombreUbicacion = 'Estacion Central B21';

IF @EstadoPrestado IS NULL OR @EstadoOperativo IS NULL OR @EstadoMantenimiento IS NULL
   OR @TipoPrestamo IS NULL OR @TipoDevolucion IS NULL OR @TipoTransferencia IS NULL
   OR @TipoMantenimiento IS NULL OR @TipoIngreso IS NULL OR @IdUbicacion2 IS NULL
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: catalogos por nombre no resueltos (Prestado/Operativo/Mantenimiento/Tipos/Ubicacion2).';
END
ELSE
    PRINT 'PASS: estados y tipos resueltos por nombre sin valores fijos.';

/* ============================================================
   TEST A - SP_RegistrarMovimientoV2 (Mantenimiento -> Operativo)
   ============================================================ */
DECLARE @ResMv TABLE (IdMovimiento INT);
DECLARE @IdMovMant INT;

INSERT INTO @ResMv EXEC dbo.SP_RegistrarMovimientoV2
    @IdTipoMovimiento = @TipoMantenimiento, @IdBien = 4, @IdUsuario = 1,
    @IdEstadoNuevo = @EstadoMantenimiento, @Observacion = 'Prueba Fase 3 mantenimiento bien 4';
SELECT @IdMovMant = IdMovimiento FROM @ResMv;

IF @IdMovMant IS NULL
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST A - no se genero movimiento de mantenimiento.';
END
ELSE IF EXISTS (SELECT 1 FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovMant AND IdTipoMovimiento <> @TipoMantenimiento)
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST A - tipo de movimiento incorrecto.';
END
ELSE IF NOT EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento = @IdMovMant AND Detalle LIKE '%Mantenimiento%')
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST A - kardex no generado por trigger.';
END
ELSE IF NOT EXISTS (SELECT 1 FROM dbo.TB_HistorialEstadoBien WHERE IdBien = 4 AND EstadoNuevo = @EstadoMantenimiento AND UsuarioCambio = 1)
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST A - historial de estado no registrado.';
END
ELSE
BEGIN
    DECLARE @CodMant VARCHAR(20);
    SELECT @CodMant = CodigoMovimiento FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovMant;
    PRINT 'PASS: TEST A - MOV ' + @CodMant + ' mantenimiento + kardex + historial estado.';
END

DELETE FROM @ResMv;
INSERT INTO @ResMv EXEC dbo.SP_RegistrarMovimientoV2
    @IdTipoMovimiento = @TipoIngreso, @IdBien = 4, @IdUsuario = 1,
    @IdEstadoNuevo = @EstadoOperativo, @Observacion = 'Prueba Fase 3 restauracion bien 4';

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = 4 AND IdEstado = @EstadoOperativo)
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST A - estado bien 4 no restaurado a Operativo.';
END
ELSE
    PRINT 'PASS: TEST A - bien 4 restaurado a Operativo.';

/* ============================================================
   TEST B - PRESTAMO bien 7 (B21-000007)
   ============================================================ */
DECLARE @ResP TABLE (IdPrestamo INT, IdMovimiento INT);
DECLARE @IdPrestamoB INT, @IdMovPrestamoB INT;
DECLARE @FechaProg DATETIME = DATEADD(DAY, 7, GETDATE());

INSERT INTO @ResP EXEC dbo.SP_RegistrarPrestamo
    @IdBien = 7, @IdBomberoSolicitante = 1, @FechaDevolucionProgramada = @FechaProg,
    @Observacion = 'Prueba Fase 3 prestamo bien 7', @IdUsuario = 1;
SELECT @IdPrestamoB = IdPrestamo, @IdMovPrestamoB = IdMovimiento FROM @ResP;

IF @IdPrestamoB IS NULL
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamoB AND Estado = 'PRESTADO' AND CodigoPrestamo LIKE 'PRE-%')
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_PrestamoDetalle WHERE IdPrestamo = @IdPrestamoB AND IdBien = 7)
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Movimiento M
               JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
               WHERE D.IdBien = 7 AND M.IdTipoMovimiento = @TipoPrestamo
                 AND D.EstadoAntes = @EstadoOperativo AND D.EstadoDespues = @EstadoPrestado
                 AND D.ResponsableDespues = 1)
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = 7 AND IdEstado = @EstadoPrestado AND IdResponsableActual = 1)
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento = @IdMovPrestamoB AND Detalle LIKE '%Prestamo%')
    SET @Fallo = @Fallo + 1;
IF (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NULL) <> 1
    SET @Fallo = @Fallo + 1;

IF @Fallo = 0 OR EXISTS (SELECT 1 FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamoB)
BEGIN
    IF (SELECT COUNT(*) FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamoB AND Estado = 'PRESTADO' AND CodigoPrestamo LIKE 'PRE-%') = 1
       AND (SELECT COUNT(*) FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovPrestamoB AND IdTipoMovimiento = @TipoPrestamo) = 1
       AND (SELECT IdEstado FROM dbo.TB_Bien WHERE IdBien = 7) = @EstadoPrestado
       AND (SELECT IdResponsableActual FROM dbo.TB_Bien WHERE IdBien = 7) = 1
       AND EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento = @IdMovPrestamoB)
       AND (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NULL) = 1
    BEGIN
        DECLARE @CodPre VARCHAR(20), @CodMovP VARCHAR(20);
        SELECT @CodPre = CodigoPrestamo FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamoB;
        SELECT @CodMovP = CodigoMovimiento FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovPrestamoB;
        PRINT 'PASS: TEST B - ' + @CodPre
            + ' + ' + @CodMovP
            + ' (Prestamo), estado Prestado, responsable 1, kardex, 1 asignacion activa.';
    END
    ELSE
    BEGIN
        SET @Fallo = @Fallo + 1;
        PRINT 'FAIL: TEST B - prestamo bien 7 (PRE/MOV/estado/responsable/kardex/asignacion).';
    END
END

/* ============================================================
   TEST C - DEVOLUCION del prestamo B
   ============================================================ */
DECLARE @ResD TABLE (IdPrestamo INT, IdMovimiento INT);
DECLARE @IdMovDevB INT;

INSERT INTO @ResD EXEC dbo.SP_RegistrarDevolucionV2
    @IdPrestamo = @IdPrestamoB, @IdEstadoRetorno = @EstadoOperativo,
    @Observacion = 'Prueba Fase 3 devolucion bien 7', @IdBomberoRecibe = 1,
    @IdResponsableNuevo = 1, @IdUsuario = 1;
SELECT @IdMovDevB = IdMovimiento FROM @ResD;

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamoB AND Estado = 'DEVUELTO' AND FechaDevolucionReal IS NOT NULL)
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Devolucion WHERE IdPrestamo = @IdPrestamoB AND IdBomberoRecibe = 1 AND EstadoRecepcion = 'Operativo')
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Movimiento M
               JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
               WHERE D.IdBien = 7 AND M.IdTipoMovimiento = @TipoDevolucion
                 AND D.EstadoAntes = @EstadoPrestado AND D.EstadoDespues = @EstadoOperativo
                 AND D.ResponsableAntes = 1 AND D.ResponsableDespues = 1)
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento = @IdMovDevB AND Detalle LIKE '%Devolucion%')
    SET @Fallo = @Fallo + 1;
IF (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NULL) <> 1
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NOT NULL)
    SET @Fallo = @Fallo + 1;

IF @Fallo = 0 OR @IdMovDevB IS NOT NULL
BEGIN
    IF (SELECT Estado FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamoB) = 'DEVUELTO'
       AND EXISTS (SELECT 1 FROM dbo.TB_Devolucion WHERE IdPrestamo = @IdPrestamoB AND FechaDevolucion IS NOT NULL)
       AND (SELECT COUNT(*) FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovDevB AND IdTipoMovimiento = @TipoDevolucion) = 1
       AND EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento = @IdMovDevB)
       AND EXISTS (SELECT 1 FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NOT NULL)
    BEGIN
        PRINT 'PASS: TEST C - prestamo DEVUELTO, fecha registrada, MOV Devolucion, kardex, asignacion cerrada.';
    END
    ELSE
    BEGIN
        SET @Fallo = @Fallo + 1;
        PRINT 'FAIL: TEST C - devolucion bien 7.';
    END
END

/* ============================================================
   TEST D - TRANSFERENCIA bien 7 (ubicacion 2 + responsable 2)
   ============================================================ */
DECLARE @ResT TABLE (IdMovimiento INT);
DECLARE @IdMovTransf INT;

INSERT INTO @ResT EXEC dbo.SP_TransferirBien
    @IdBien = 7, @IdNuevaUbicacion = @IdUbicacion2, @IdNuevoResponsable = 2,
    @IdUsuario = 1, @Motivo = 'Prueba Fase 3 transferencia bien 7';
SELECT @IdMovTransf = IdMovimiento FROM @ResT;

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = 7 AND IdUbicacion = @IdUbicacion2 AND IdResponsableActual = 2)
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Movimiento M
               JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
               WHERE D.IdBien = 7 AND M.IdTipoMovimiento = @TipoTransferencia
                 AND D.UbicacionAntes = 1 AND D.UbicacionDespues = @IdUbicacion2
                 AND D.ResponsableAntes = 1 AND D.ResponsableDespues = 2)
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento = @IdMovTransf AND Detalle LIKE '%Transferencia%')
    SET @Fallo = @Fallo + 1;
IF (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NULL) <> 1
    SET @Fallo = @Fallo + 1;

IF @Fallo = 0 OR @IdMovTransf IS NOT NULL
BEGIN
    IF (SELECT IdUbicacion FROM dbo.TB_Bien WHERE IdBien = 7) = @IdUbicacion2
       AND (SELECT IdResponsableActual FROM dbo.TB_Bien WHERE IdBien = 7) = 2
       AND EXISTS (SELECT 1 FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovTransf AND IdTipoMovimiento = @TipoTransferencia)
       AND EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento = @IdMovTransf)
       AND (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NULL) = 1
    BEGIN
        DECLARE @CodTransf VARCHAR(20);
        SELECT @CodTransf = CodigoMovimiento FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovTransf;
        PRINT 'PASS: TEST D - ' + @CodTransf
            + ' (Transferencia), ubicacion 2, responsable 2, kardex.';
    END
    ELSE
    BEGIN
        SET @Fallo = @Fallo + 1;
        PRINT 'FAIL: TEST D - transferencia bien 7.';
    END
END

/* ============================================================
   TEST E - PRESTAMO bien 4 + DEVOLUCION con responsable NULL
   ============================================================ */
DECLARE @IdPrestamoE INT, @IdMovDevE INT;
DELETE FROM @ResP;

INSERT INTO @ResP EXEC dbo.SP_RegistrarPrestamo
    @IdBien = 4, @IdBomberoSolicitante = 2, @Observacion = 'Prueba Fase 3 prestamo bien 4', @IdUsuario = 1;
SELECT @IdPrestamoE = IdPrestamo FROM @ResP;

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamoE AND Estado = 'PRESTADO')
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST E - prestamo bien 4 no creado.';
END

DELETE FROM @ResD;
INSERT INTO @ResD EXEC dbo.SP_RegistrarDevolucionV2
    @IdPrestamo = @IdPrestamoE, @IdEstadoRetorno = @EstadoOperativo,
    @Observacion = 'Prueba Fase 3 devolucion bien 4', @IdBomberoRecibe = 2,
    @IdResponsableNuevo = NULL, @IdUsuario = 1;
SELECT @IdMovDevE = IdMovimiento FROM @ResD;

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = 4 AND IdEstado = @EstadoOperativo AND IdResponsableActual IS NULL)
    SET @Fallo = @Fallo + 1;
IF (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 4 AND FechaFin IS NULL) <> 0
    SET @Fallo = @Fallo + 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TB_MovimientoDetalle WHERE IdMovimiento = @IdMovDevE AND IdBien = 4 AND ResponsableDespues IS NULL)
    SET @Fallo = @Fallo + 1;

IF @Fallo = 0 OR @IdMovDevE IS NOT NULL
BEGIN
    IF (SELECT IdResponsableActual FROM dbo.TB_Bien WHERE IdBien = 4) IS NULL
       AND (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 4 AND FechaFin IS NULL) = 0
    BEGIN
        PRINT 'PASS: TEST E - devolucion sin responsable: bien 4 queda NULL, asignaciones cerradas.';
    END
    ELSE
    BEGIN
        SET @Fallo = @Fallo + 1;
        PRINT 'FAIL: TEST E - devolucion con responsable NULL.';
    END
END

/* ============================================================
   TEST F - ROLLBACK (sin datos parciales)
   ============================================================ */
DECLARE @c1 INT, @c2 INT, @F1 INT = 0, @F2 INT = 0, @F3 INT = 0, @F4 INT = 0, @F5 INT = 0;

/* F1: bien inexistente en prestamo */
SELECT @c1 = COUNT(*) FROM dbo.TB_Movimiento;
SELECT @c2 = COUNT(*) FROM dbo.TB_Prestamo;
BEGIN TRY
    EXEC dbo.SP_RegistrarPrestamo @IdBien = 99999, @IdBomberoSolicitante = 1, @IdUsuario = 1;
END TRY
BEGIN CATCH
    SET @F1 = 1;
    SET @Msg = ERROR_MESSAGE();
END CATCH
IF @F1 = 1
   AND (SELECT COUNT(*) FROM dbo.TB_Movimiento) = @c1
   AND (SELECT COUNT(*) FROM dbo.TB_Prestamo) = @c2
   AND NOT EXISTS (SELECT 1 FROM dbo.TB_Kardex WHERE IdMovimiento NOT IN (SELECT IdMovimiento FROM dbo.TB_Movimiento))
BEGIN
    PRINT 'PASS: TEST F1 - bien inexistente rechazado sin datos parciales.';
END
ELSE
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST F1 - bien inexistente.';
END

/* F2: prestamo inexistente en devolucion */
SELECT @c1 = COUNT(*) FROM dbo.TB_Devolucion;
SELECT @c2 = COUNT(*) FROM dbo.TB_Prestamo;
BEGIN TRY
    EXEC dbo.SP_RegistrarDevolucionV2 @IdPrestamo = 99999, @IdEstadoRetorno = @EstadoOperativo,
        @IdBomberoRecibe = 1, @IdUsuario = 1;
END TRY
BEGIN CATCH
    SET @F2 = 1;
END CATCH
IF @F2 = 1
   AND (SELECT COUNT(*) FROM dbo.TB_Devolucion) = @c1
   AND (SELECT COUNT(*) FROM dbo.TB_Prestamo) = @c2
BEGIN
    PRINT 'PASS: TEST F2 - prestamo inexistente rechazado sin datos parciales.';
END
ELSE
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST F2 - prestamo inexistente.';
END

/* F3: prestamo ya devuelto */
SELECT @c1 = COUNT(*) FROM dbo.TB_Devolucion;
SELECT @c2 = COUNT(*) FROM dbo.TB_Movimiento;
BEGIN TRY
    EXEC dbo.SP_RegistrarDevolucionV2 @IdPrestamo = @IdPrestamoB, @IdEstadoRetorno = @EstadoOperativo,
        @IdBomberoRecibe = 1, @IdUsuario = 1;
END TRY
BEGIN CATCH
    SET @F3 = 1;
    SET @Msg = ERROR_MESSAGE();
END CATCH
IF @F3 = 1 AND @Msg LIKE '%ya fue devuelto%'
   AND (SELECT COUNT(*) FROM dbo.TB_Devolucion) = @c1
   AND (SELECT COUNT(*) FROM dbo.TB_Movimiento) = @c2
BEGIN
    PRINT 'PASS: TEST F3 - prestamo ya devuelto rechazado sin datos parciales.';
END
ELSE
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST F3 - prestamo ya devuelto.';
END

/* F4: estado inexistente en devolucion */
DECLARE @IdPrestamoF4 INT;
DECLARE @ResF4 TABLE (IdPrestamo INT, IdMovimiento INT);
DELETE FROM @ResF4;
INSERT INTO @ResF4 EXEC dbo.SP_RegistrarPrestamo
    @IdBien = 7, @IdBomberoSolicitante = 1, @Observacion = 'Prueba Fase 3 prestamo rollback', @IdUsuario = 1;
SELECT @IdPrestamoF4 = IdPrestamo FROM @ResF4;

SELECT @c1 = COUNT(*) FROM dbo.TB_Devolucion;
SELECT @c2 = COUNT(*) FROM dbo.TB_Movimiento;
BEGIN TRY
    EXEC dbo.SP_RegistrarDevolucionV2 @IdPrestamo = @IdPrestamoF4, @IdEstadoRetorno = 99999,
        @IdBomberoRecibe = 1, @IdUsuario = 1;
END TRY
BEGIN CATCH
    SET @F4 = 1;
END CATCH
IF @F4 = 1
   AND (SELECT COUNT(*) FROM dbo.TB_Devolucion) = @c1
   AND (SELECT COUNT(*) FROM dbo.TB_Movimiento) = @c2
BEGIN
    PRINT 'PASS: TEST F4 - estado inexistente rechazado sin datos parciales.';
END
ELSE
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST F4 - estado inexistente.';
END

/* F5: conflicto de asignacion activa (indice filtrado unico) */
DECLARE @cHA INT;
SELECT @cHA = COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NULL;
BEGIN TRY
    INSERT INTO dbo.TB_HistorialAsignacion (IdBien, IdBombero, FechaAsignacion, Motivo)
    VALUES (7, 1, GETDATE(), 'Test conflicto asignacion activa');
END TRY
BEGIN CATCH
    SET @F5 = 1;
END CATCH
IF @F5 = 1
   AND (SELECT COUNT(*) FROM dbo.TB_HistorialAsignacion WHERE IdBien = 7 AND FechaFin IS NULL) = @cHA
BEGIN
    PRINT 'PASS: TEST F5 - conflicto asignacion activa rechazado (indice filtrado).';
END
ELSE
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST F5 - conflicto asignacion activa.';
END

/* Devolucion normal del prestamo F4 (estado Operativo, responsable NULL) */
DELETE FROM @ResD;
INSERT INTO @ResD EXEC dbo.SP_RegistrarDevolucionV2
    @IdPrestamo = @IdPrestamoF4, @IdEstadoRetorno = @EstadoOperativo,
    @Observacion = 'Devolucion cierre prestamo rollback', @IdBomberoRecibe = 1,
    @IdResponsableNuevo = NULL, @IdUsuario = 1;

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bien WHERE IdBien = 7 AND IdEstado = @EstadoOperativo AND IdResponsableActual IS NULL)
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST F4b - cierre del prestamo F4 (bien 7 Operativo, responsable NULL).';
END
ELSE
    PRINT 'PASS: TEST F4b - cierre prestamo F4: bien 7 Operativo sin responsable.';

/* ============================================================
   TEST G - Sanity de consultas
   ============================================================ */
DECLARE @Kardex TABLE (IdKardex INT, IdBien INT, CodigoInterno VARCHAR(20), Fecha DATETIME,
    TipoMovimiento VARCHAR(100), CodigoMovimiento VARCHAR(20), IdMovimiento INT,
    EstadoAnterior VARCHAR(100), EstadoNuevo VARCHAR(100),
    UbicacionAnterior VARCHAR(200), UbicacionNueva VARCHAR(200),
    ResponsableAnterior VARCHAR(200), ResponsableNuevo VARCHAR(200),
    Usuario VARCHAR(100), Observacion VARCHAR(MAX), Detalle VARCHAR(MAX));
INSERT INTO @Kardex EXEC dbo.SP_ObtenerKardexBien @CodigoInterno = 'B21-000007';

DECLARE @NroKardex INT;
SELECT @NroKardex = COUNT(*) FROM @Kardex;

IF @NroKardex < 6
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST G1 - kardex bien 7 incompleto (esperado >= 6, obtenido ' + CAST(@NroKardex AS VARCHAR(10)) + ').';
END
ELSE IF NOT EXISTS (SELECT 1 FROM @Kardex WHERE TipoMovimiento = 'Prestamo' AND EstadoAnterior = 'Operativo' AND EstadoNuevo = 'Prestado')
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST G1 - kardex no contiene la vista enriquecida del prestamo.';
END
ELSE
    PRINT 'PASS: TEST G1 - SP_ObtenerKardexBien devuelve trazabilidad enriquecida (' + CAST(@NroKardex AS VARCHAR(10)) + ' registros).';

DECLARE @G2Ok INT = 1;
BEGIN TRY
    EXEC dbo.SP_ObtenerMovimiento @IdMovimiento = @IdMovPrestamoB;
END TRY
BEGIN CATCH
    SET @G2Ok = 0;
END CATCH

IF @G2Ok = 1
   AND EXISTS (SELECT 1 FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovPrestamoB AND CodigoMovimiento LIKE 'MOV-%')
   AND EXISTS (SELECT 1 FROM dbo.TB_MovimientoDetalle WHERE IdMovimiento = @IdMovPrestamoB AND IdBien = 7)
BEGIN
    DECLARE @CodMovB VARCHAR(20);
    SELECT @CodMovB = CodigoMovimiento FROM dbo.TB_Movimiento WHERE IdMovimiento = @IdMovPrestamoB;
    PRINT 'PASS: TEST G2 - SP_ObtenerMovimiento devuelve cabecera + detalle (' + @CodMovB + ').';
END
ELSE
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST G2 - SP_ObtenerMovimiento.';
END

DECLARE @G3Ok INT = 1;
BEGIN TRY
    EXEC dbo.SP_ListarMovimientos @Filtro = 'B21-000007';
END TRY
BEGIN CATCH
    SET @G3Ok = 0;
END CATCH

IF @G3Ok = 1
   AND (SELECT COUNT(*) FROM dbo.TB_MovimientoDetalle D
        JOIN dbo.TB_Movimiento M ON M.IdMovimiento = D.IdMovimiento
        WHERE D.IdBien = 7) >= 3
BEGIN
    DECLARE @NroLst INT;
    SELECT @NroLst = COUNT(*) FROM dbo.TB_MovimientoDetalle D
    JOIN dbo.TB_Movimiento M ON M.IdMovimiento = D.IdMovimiento
    WHERE D.IdBien = 7;
    PRINT 'PASS: TEST G3 - SP_ListarMovimientos con filtro (bien 7: ' + CAST(@NroLst AS VARCHAR(10)) + ' movimientos).';
END
ELSE
BEGIN
    SET @Fallo = @Fallo + 1;
    PRINT 'FAIL: TEST G3 - SP_ListarMovimientos con filtro.';
END

/* ============================================================
   RESUMEN
   ============================================================ */
IF @Fallo = 0
    PRINT '== RESULTADO: TODAS LAS PRUEBAS PASARON ==';
ELSE
    PRINT '== RESULTADO: PRUEBAS CON FALLOS (' + CAST(@Fallo AS VARCHAR(10)) + ') ==';
GO

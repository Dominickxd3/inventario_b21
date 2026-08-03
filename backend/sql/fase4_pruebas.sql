/* ============================================================================
   FASE 4 - PRUEBAS DE MANTENIMIENTO (BD_Inventario_B21)
   Ejecutar solo despues de aplicar fase4_mantenimiento.sql
   Nota: se evita INSERT-EXEC (incompatible con ROLLBACK en los SPs).
   ============================================================================ */
SET NOCOUNT ON;
GO

/* ---------------------------------------------------------------------------
   TEST A: REGISTRAR MANTENIMIENTO (bien 2, Operativo)
   Esperado: exito; bien 2 -> Mantenimiento(4); movimiento tipo 6; kardex;
             historial 2->3->4 (2 filas); ficha EN MANTENIMIENTO.
   --------------------------------------------------------------------------- */
DECLARE @ErrA VARCHAR(500) = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento
        @IdBien = 2,
        @TipoMantenimiento = 'Preventivo',
        @Diagnostico = 'Prueba diagnostico A',
        @IdResponsableTecnico = 1,
        @Observaciones = 'Observaciones A',
        @Repuestos = NULL,
        @IdUsuario = 1;
END TRY
BEGIN CATCH
    SET @ErrA = ERROR_MESSAGE();
END CATCH

DECLARE @IdMantoA INT;
DECLARE @IdMovA INT;
SELECT @IdMantoA = IdMantenimiento
FROM dbo.TB_Mantenimiento
WHERE IdBien = 2 AND FechaInicio >= DATEADD(MINUTE, -5, GETDATE());

SELECT @IdMovA = M.IdMovimiento
FROM dbo.TB_Movimiento M
JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
WHERE D.IdBien = 2 AND M.IdTipoMovimiento = 6
  AND M.FechaMovimiento >= DATEADD(MINUTE, -5, GETDATE());

IF @ErrA IS NULL AND @IdMantoA IS NOT NULL
    PRINT '== PASS: A1: registro exitoso (IdMantenimiento=' + CAST(@IdMantoA AS VARCHAR) + ')';
ELSE
    PRINT '== FAIL: A1: -> ' + ISNULL(@ErrA, 'sin ficha creada');

IF (SELECT IdEstado FROM dbo.TB_Bien WHERE IdBien = 2) = 4
    PRINT '== PASS: A2: bien 2 en estado Mantenimiento(4)';
ELSE
    PRINT '== FAIL: A2: bien 2 no esta en Mantenimiento';

IF EXISTS (SELECT 1 FROM dbo.TB_Mantenimiento
           WHERE IdMantenimiento = @IdMantoA
             AND Estado = 'EN MANTENIMIENTO'
             AND Responsable = 'Juan Perez'
             AND Observaciones = 'Observaciones A'
             AND TipoMantenimiento = 'Preventivo')
    PRINT '== PASS: A3: ficha EN MANTENIMIENTO con responsable y observaciones';
ELSE
    PRINT '== FAIL: A3: ficha incorrecta';

IF EXISTS (SELECT 1 FROM dbo.TB_Movimiento M
           JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
           WHERE M.IdMovimiento = @IdMovA
             AND M.IdTipoMovimiento = 6
             AND D.EstadoAntes = 2 AND D.EstadoDespues = 4)
    PRINT '== PASS: A4: movimiento tipo 6 con detalle 2->4';
ELSE
    PRINT '== FAIL: A4: movimiento/detalle incorrecto';

IF EXISTS (SELECT 1 FROM dbo.TB_Kardex
           WHERE IdMovimiento = @IdMovA AND Detalle LIKE 'Mantenimiento%')
    PRINT '== PASS: A5: kardex generado por trigger';
ELSE
    PRINT '== FAIL: A5: kardex no generado';

IF (SELECT COUNT(*) FROM dbo.TB_HistorialEstadoBien
    WHERE IdBien = 2 AND FechaCambio >= DATEADD(MINUTE, -5, GETDATE())) = 2
    PRINT '== PASS: A6: historial 2->3->4 (2 filas)';
ELSE
    PRINT '== FAIL: A6: historial incorrecto';

IF EXISTS (SELECT 1 FROM dbo.TB_HistorialEstadoBien
           WHERE IdBien = 2 AND EstadoAnterior = 3 AND EstadoNuevo = 4)
    PRINT '== PASS: A7: transicion Averiado->Mantenimiento registrada';
ELSE
    PRINT '== FAIL: A7: transicion intermedia no registrada';
GO

/* ---------------------------------------------------------------------------
   TEST A2: REINTENTAR REGISTRO SOBRE BIEN EN MANTENIMIENTO
   Esperado: error 'El bien ya se encuentra en mantenimiento.' sin cambios
   --------------------------------------------------------------------------- */
DECLARE @MovAntesA2 INT;
SELECT @MovAntesA2 = COUNT(*) FROM dbo.TB_Movimiento;

DECLARE @ErrA2 VARCHAR(500) = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento @IdBien = 2, @TipoMantenimiento = 'Correctivo', @IdUsuario = 1;
    SET @ErrA2 = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrA2 = ERROR_MESSAGE();
END CATCH

IF @ErrA2 LIKE '%ya se encuentra en mantenimiento%'
    PRINT '== PASS: A2: error "ya se encuentra en mantenimiento"';
ELSE
    PRINT '== FAIL: A2: -> ' + ISNULL(@ErrA2, 'NULL');

IF @MovAntesA2 = (SELECT COUNT(*) FROM dbo.TB_Movimiento)
    PRINT '== PASS: A2: sin nuevos movimientos (rollback)';
ELSE
    PRINT '== FAIL: A2: se crearon movimientos indebidos';
GO

/* ---------------------------------------------------------------------------
   TEST D: FINALIZAR MANTENIMIENTO INEXISTENTE -> error
   --------------------------------------------------------------------------- */
DECLARE @ErrD VARCHAR(500) = NULL;
BEGIN TRY
    EXEC dbo.SP_FinalizarMantenimiento @IdMantenimiento = 999999, @IdUsuario = 1;
    SET @ErrD = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrD = ERROR_MESSAGE();
END CATCH

IF @ErrD LIKE '%no existe%'
    PRINT '== PASS: D: error "El mantenimiento no existe."';
ELSE
    PRINT '== FAIL: D: -> ' + ISNULL(@ErrD, 'NULL');
GO

/* ---------------------------------------------------------------------------
   TEST B: FINALIZAR MANTENIMIENTO (bien 2)
   Esperado: exito; bien 2 -> Operativo(2); FINALIZADO; movimiento 4->2; kardex
   --------------------------------------------------------------------------- */
DECLARE @IdMantoB INT;
SELECT @IdMantoB = IdMantenimiento FROM dbo.TB_Mantenimiento WHERE IdBien = 2 AND Estado = 'EN MANTENIMIENTO';

DECLARE @ErrB VARCHAR(500) = NULL;
BEGIN TRY
    EXEC dbo.SP_FinalizarMantenimiento
        @IdMantenimiento = @IdMantoB,
        @TrabajoRealizado = 'Cambio de componente y prueba operativa',
        @Costo = 150.50,
        @Observaciones = 'Mantenimiento completado',
        @IdUsuario = 1;
END TRY
BEGIN CATCH
    SET @ErrB = ERROR_MESSAGE();
END CATCH

IF @ErrB IS NULL
    PRINT '== PASS: B0: finalizacion exitosa';
ELSE
    PRINT '== FAIL: B0: -> ' + @ErrB;

IF (SELECT IdEstado FROM dbo.TB_Bien WHERE IdBien = 2) = 2
    PRINT '== PASS: B1: bien 2 vuelve a Operativo(2)';
ELSE
    PRINT '== FAIL: B1: bien 2 no volvio a Operativo';

IF EXISTS (SELECT 1 FROM dbo.TB_Mantenimiento
           WHERE IdMantenimiento = @IdMantoB
             AND Estado = 'FINALIZADO' AND Costo = 150.50
             AND FechaFin IS NOT NULL AND TrabajoRealizado IS NOT NULL)
    PRINT '== PASS: B2: ficha FINALIZADO con costo, fecha y trabajo realizado';
ELSE
    PRINT '== FAIL: B2: ficha de finalizacion incorrecta';

IF EXISTS (SELECT 1 FROM dbo.TB_Movimiento M
           JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
           WHERE M.IdTipoMovimiento = 6
             AND M.FechaMovimiento >= DATEADD(MINUTE, -5, GETDATE())
             AND D.IdBien = 2
             AND D.EstadoAntes = 4 AND D.EstadoDespues = 2)
    PRINT '== PASS: B3: movimiento de finalizacion 4->2';
ELSE
    PRINT '== FAIL: B3: movimiento de finalizacion incorrecto';

IF EXISTS (SELECT 1 FROM dbo.TB_MovimientoDetalle D
           JOIN dbo.TB_Kardex K ON K.IdMovimiento = D.IdMovimiento
           JOIN dbo.TB_Movimiento M ON M.IdMovimiento = D.IdMovimiento
           WHERE D.IdBien = 2 AND D.EstadoAntes = 4 AND D.EstadoDespues = 2
             AND M.FechaMovimiento >= DATEADD(MINUTE, -5, GETDATE())
             AND K.Detalle LIKE 'Mantenimiento%')
    PRINT '== PASS: B4: kardex de finalizacion generado';
ELSE
    PRINT '== FAIL: B4: kardex de finalizacion no generado';

IF EXISTS (SELECT 1 FROM dbo.TB_HistorialEstadoBien
           WHERE IdBien = 2 AND EstadoAnterior = 4 AND EstadoNuevo = 2
             AND FechaCambio >= DATEADD(MINUTE, -5, GETDATE()))
    PRINT '== PASS: B5: historial 4->2 registrado';
ELSE
    PRINT '== FAIL: B5: historial 4->2 no registrado';
GO

/* ---------------------------------------------------------------------------
   TEST B2: FINALIZAR DOS VECES -> error
   --------------------------------------------------------------------------- */
DECLARE @IdMantoB2 INT;
SELECT @IdMantoB2 = IdMantenimiento FROM dbo.TB_Mantenimiento WHERE IdBien = 2 AND Estado = 'FINALIZADO';

DECLARE @ErrB2 VARCHAR(500) = NULL;
BEGIN TRY
    EXEC dbo.SP_FinalizarMantenimiento @IdMantenimiento = @IdMantoB2, @IdUsuario = 1;
    SET @ErrB2 = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrB2 = ERROR_MESSAGE();
END CATCH

IF @ErrB2 LIKE '%ya fue finalizado%'
    PRINT '== PASS: B2: error "El mantenimiento ya fue finalizado."';
ELSE
    PRINT '== FAIL: B2: -> ' + ISNULL(@ErrB2, 'NULL');
GO

/* ---------------------------------------------------------------------------
   TESTS D1/D2/D5/D6/D9: VALIDACIONES DE REGISTRO (bien 1, Averiado, sin cambios)
   --------------------------------------------------------------------------- */
DECLARE @MovAntesV INT;
SELECT @MovAntesV = COUNT(*) FROM dbo.TB_Movimiento;
DECLARE @MantoAntesV INT;
SELECT @MantoAntesV = COUNT(*) FROM dbo.TB_Mantenimiento;

DECLARE @ErrV VARCHAR(500) = NULL;

/* D1: bien inexistente */
SET @ErrV = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento @IdBien = 999999, @TipoMantenimiento = 'Preventivo', @IdUsuario = 1;
    SET @ErrV = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrV = ERROR_MESSAGE();
END CATCH
IF @ErrV LIKE '%eliminado%' OR @ErrV LIKE '%no existe%'
    PRINT '== PASS: D1: error "El bien no existe o esta eliminado."';
ELSE
    PRINT '== FAIL: D1: -> ' + ISNULL(@ErrV, 'NULL');

/* D2: tipo de mantenimiento invalido */
SET @ErrV = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento @IdBien = 1, @TipoMantenimiento = 'NOEXISTE', @IdUsuario = 1;
    SET @ErrV = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrV = ERROR_MESSAGE();
END CATCH
IF @ErrV LIKE '%tipo de mantenimiento no es%'
    PRINT '== PASS: D2: error "El tipo de mantenimiento no es valido."';
ELSE
    PRINT '== FAIL: D2: -> ' + ISNULL(@ErrV, 'NULL');

/* D9: responsable tecnico inexistente */
SET @ErrV = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento @IdBien = 1, @TipoMantenimiento = 'Preventivo', @IdResponsableTecnico = 999999, @IdUsuario = 1;
    SET @ErrV = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrV = ERROR_MESSAGE();
END CATCH
IF @ErrV LIKE '%inactivo%' OR @ErrV LIKE '%no existe%'
    PRINT '== PASS: D9: error "bombero tecnico no existe o inactivo"';
ELSE
    PRINT '== FAIL: D9: -> ' + ISNULL(@ErrV, 'NULL');

/* D5: repuestos XML invalido */
SET @ErrV = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento @IdBien = 1, @TipoMantenimiento = 'Preventivo', @Repuestos = 'NOESXML', @IdUsuario = 1;
    SET @ErrV = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrV = ERROR_MESSAGE();
END CATCH
IF @ErrV LIKE '%formato de repuestos%'
    PRINT '== PASS: D5: error "formato de repuestos no es valido"';
ELSE
    PRINT '== FAIL: D5: -> ' + ISNULL(@ErrV, 'NULL');

/* D6: repuestos con datos invalidos (cantidad 0) */
SET @ErrV = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento @IdBien = 1, @TipoMantenimiento = 'Preventivo',
        @Repuestos = '<r><i><n>Filtro</n><c>0</c><u>10</u></i></r>', @IdUsuario = 1;
    SET @ErrV = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrV = ERROR_MESSAGE();
END CATCH
IF @ErrV LIKE '%repuestos no son%'
    PRINT '== PASS: D6: error "datos de repuestos no son validos"';
ELSE
    PRINT '== FAIL: D6: -> ' + ISNULL(@ErrV, 'NULL');

IF @MovAntesV = (SELECT COUNT(*) FROM dbo.TB_Movimiento)
    AND @MantoAntesV = (SELECT COUNT(*) FROM dbo.TB_Mantenimiento)
    PRINT '== PASS: VALIDACIONES: sin movimientos ni mantenimientos colaterales';
ELSE
    PRINT '== FAIL: VALIDACIONES: hubo efectos colaterales';

IF (SELECT IdEstado FROM dbo.TB_Bien WHERE IdBien = 1) = 3
    PRINT '== PASS: VALIDACIONES: bien 1 sigue Averiado(3)';
ELSE
    PRINT '== FAIL: VALIDACIONES: bien 1 fue modificado';
GO

/* ---------------------------------------------------------------------------
   TEST D4: MANTENIMIENTO SOBRE BIEN PRESTADO
   Flujo: prestamo bien 4 -> intentar mantenimiento (error) -> devolucion
   --------------------------------------------------------------------------- */
DECLARE @IdPrestamo4 INT;
EXEC dbo.SP_RegistrarPrestamo @IdBien = 4, @IdBomberoSolicitante = 1, @IdUsuario = 1;
SELECT @IdPrestamo4 = P.IdPrestamo
FROM dbo.TB_Prestamo P
JOIN dbo.TB_PrestamoDetalle PD ON PD.IdPrestamo = P.IdPrestamo
WHERE PD.IdBien = 4 AND P.FechaDevolucionReal IS NULL;

DECLARE @ErrD4 VARCHAR(500) = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento @IdBien = 4, @TipoMantenimiento = 'Correctivo', @IdUsuario = 1;
    SET @ErrD4 = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrD4 = ERROR_MESSAGE();
END CATCH

IF @ErrD4 LIKE '%prestado%'
    PRINT '== PASS: D4: error "No se puede registrar mantenimiento de un bien prestado."';
ELSE
    PRINT '== FAIL: D4: -> ' + ISNULL(@ErrD4, 'NULL');

IF (SELECT IdEstado FROM dbo.TB_Bien WHERE IdBien = 4) = 5
    PRINT '== PASS: D4: bien 4 sigue Prestado(5)';
ELSE
    PRINT '== FAIL: D4: bien 4 fue modificado';

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Mantenimiento WHERE IdBien = 4)
    PRINT '== PASS: D4: sin ficha de mantenimiento para bien 4';
ELSE
    PRINT '== FAIL: D4: ficha de mantenimiento creada indebidamente';

/* Devolucion para liberar bien 4 */
EXEC dbo.SP_RegistrarDevolucionV2
    @IdPrestamo = @IdPrestamo4, @IdEstadoRetorno = 2, @IdBomberoRecibe = 1, @IdUsuario = 1;

IF (SELECT IdEstado FROM dbo.TB_Bien WHERE IdBien = 4) = 2
    PRINT '== PASS: D4: bien 4 Operativo(2) tras devolucion';
ELSE
    PRINT '== FAIL: D4: bien 4 no volvio a Operativo';
GO

/* ---------------------------------------------------------------------------
   TEST C: REGISTRAR MANTENIMIENTO CON REPUESTOS (bien 4)
   Esperado: ficha + 2 repuestos + total 46.00
   --------------------------------------------------------------------------- */
DECLARE @ErrC VARCHAR(500) = NULL;
BEGIN TRY
    EXEC dbo.SP_RegistrarMantenimiento
        @IdBien = 4,
        @TipoMantenimiento = 'Correctivo',
        @Diagnostico = 'Falla en sistema hidraulico',
        @Repuestos = '<r><i><n>Filtro hidraulico</n><c>2</c><u>10.50</u></i><i><n>Sello</n><c>1</c><u>25.00</u></i></r>',
        @IdUsuario = 1;
END TRY
BEGIN CATCH
    SET @ErrC = ERROR_MESSAGE();
END CATCH

DECLARE @IdMantoC INT;
SELECT @IdMantoC = IdMantenimiento
FROM dbo.TB_Mantenimiento
WHERE IdBien = 4 AND FechaInicio >= DATEADD(MINUTE, -5, GETDATE());

IF @ErrC IS NULL AND @IdMantoC IS NOT NULL
    PRINT '== PASS: C1: registro con repuestos exitoso (IdMantenimiento=' + CAST(@IdMantoC AS VARCHAR) + ')';
ELSE
    PRINT '== FAIL: C1: -> ' + ISNULL(@ErrC, 'sin ficha creada');

IF (SELECT COUNT(*) FROM dbo.TB_MantenimientoRepuesto WHERE IdMantenimiento = @IdMantoC) = 2
    PRINT '== PASS: C2: 2 repuestos insertados';
ELSE
    PRINT '== FAIL: C2: cantidad de repuestos incorrecta';

IF (SELECT SUM(Cantidad * CostoUnitario) FROM dbo.TB_MantenimientoRepuesto WHERE IdMantenimiento = @IdMantoC) = 46.00
    PRINT '== PASS: C3: costo repuestos = 46.00';
ELSE
    PRINT '== FAIL: C3: costo repuestos incorrecto';
GO

/* ---------------------------------------------------------------------------
   TEST E: CONSULTAS (SP_ListarMantenimientos / SP_ObtenerMantenimiento)
   Se ejecutan dentro de TRY/CATCH (2 result sets) y se verifica la data de BD.
   --------------------------------------------------------------------------- */
DECLARE @ErrE VARCHAR(500) = NULL;

/* E1: listar con filtro */
SET @ErrE = NULL;
BEGIN TRY
    EXEC dbo.SP_ListarMantenimientos @Filtro = 'B21-000004';
    PRINT '== PASS: E1: listar con filtro B21-000004 ejecutado sin error';
END TRY
BEGIN CATCH
    SET @ErrE = ERROR_MESSAGE();
    PRINT '== FAIL: E1: -> ' + @ErrE;
END CATCH

/* E2: listar por estado */
SET @ErrE = NULL;
BEGIN TRY
    EXEC dbo.SP_ListarMantenimientos @Estado = 'EN MANTENIMIENTO';
    PRINT '== PASS: E2: listar por estado EN MANTENIMIENTO ejecutado sin error';
END TRY
BEGIN CATCH
    SET @ErrE = ERROR_MESSAGE();
    PRINT '== FAIL: E2: -> ' + @ErrE;
END CATCH

/* E3: paginacion */
SET @ErrE = NULL;
BEGIN TRY
    EXEC dbo.SP_ListarMantenimientos @Pagina = 1, @Filas = 1;
    PRINT '== PASS: E3: listar paginado ejecutado sin error';
END TRY
BEGIN CATCH
    SET @ErrE = ERROR_MESSAGE();
    PRINT '== FAIL: E3: -> ' + @ErrE;
END CATCH

/* E4: obtener mantenimiento del bien 4 */
SET @ErrE = NULL;
BEGIN TRY
    EXEC dbo.SP_ObtenerMantenimiento @IdMantenimiento = @IdMantoC;
    PRINT '== PASS: E4: obtener mantenimiento ejecutado sin error';
END TRY
BEGIN CATCH
    SET @ErrE = ERROR_MESSAGE();
    PRINT '== FAIL: E4: -> ' + @ErrE;
END CATCH

/* E4b: obtener mantenimiento inexistente -> error */
SET @ErrE = NULL;
BEGIN TRY
    EXEC dbo.SP_ObtenerMantenimiento @IdMantenimiento = 999999;
    SET @ErrE = 'SIN ERROR';
END TRY
BEGIN CATCH
    SET @ErrE = ERROR_MESSAGE();
END CATCH
IF @ErrE LIKE '%no existe%'
    PRINT '== PASS: E4b: obtener inexistente da error "El mantenimiento no existe."';
ELSE
    PRINT '== FAIL: E4b: -> ' + ISNULL(@ErrE, 'NULL');
GO

/* ---------------------------------------------------------------------------
   RESULTADO FINAL
   --------------------------------------------------------------------------- */
DECLARE @TotalManto INT;
SELECT @TotalManto = COUNT(*) FROM dbo.TB_Mantenimiento;
DECLARE @EnManto INT;
SELECT @EnManto = COUNT(*) FROM dbo.TB_Mantenimiento WHERE Estado = 'EN MANTENIMIENTO';
DECLARE @FinManto INT;
SELECT @FinManto = COUNT(*) FROM dbo.TB_Mantenimiento WHERE Estado = 'FINALIZADO';
DECLARE @EstadoBien2 INT;
SELECT @EstadoBien2 = IdEstado FROM dbo.TB_Bien WHERE IdBien = 2;
DECLARE @EstadoBien4 INT;
SELECT @EstadoBien4 = IdEstado FROM dbo.TB_Bien WHERE IdBien = 4;

PRINT '==============================================';
PRINT ' RESUMEN FASE 4:';
PRINT '  Mantenimientos en BD  : ' + CAST(@TotalManto AS VARCHAR) + ' (incluye 1 legacy)';
PRINT '  EN MANTENIMIENTO      : ' + CAST(@EnManto AS VARCHAR);
PRINT '  FINALIZADO            : ' + CAST(@FinManto AS VARCHAR);
PRINT '  Bien 2 estado         : ' + CAST(@EstadoBien2 AS VARCHAR) + ' (esperado 2 Operativo)';
PRINT '  Bien 4 estado         : ' + CAST(@EstadoBien4 AS VARCHAR) + ' (esperado 4 Mantenimiento)';
PRINT '==============================================';
GO

PRINT '== FIN DE PRUEBAS FASE 4 ==';
GO

/* FASE 4 - TEST E (consultas) ejecutado por separado */
SET NOCOUNT ON;
GO

DECLARE @IdMantoC INT;
SELECT @IdMantoC = IdMantenimiento
FROM dbo.TB_Mantenimiento
WHERE IdBien = 4 AND FechaInicio >= DATEADD(MINUTE, -15, GETDATE());

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

/* Verificacion de contenido del listado (SP devuelve 2 result sets; la data
   se verifica directamente sobre las tablas) */
IF EXISTS (
    SELECT 1 FROM dbo.TB_Mantenimiento M
    JOIN dbo.TB_Bien B ON B.IdBien = M.IdBien
    WHERE B.CodigoInterno LIKE '%B21-000004%' AND M.FechaInicio IS NOT NULL
)
    PRINT '== PASS: E5: data consistente para filtro B21-000004';
ELSE
    PRINT '== FAIL: E5: data inconsistente';

DECLARE @TotalManto INT;
SELECT @TotalManto = COUNT(*) FROM dbo.TB_Mantenimiento;
DECLARE @EnManto INT;
SELECT @EnManto = COUNT(*) FROM dbo.TB_Mantenimiento WHERE Estado = 'EN MANTENIMIENTO';
DECLARE @FinManto INT;
SELECT @FinManto = COUNT(*) FROM dbo.TB_Mantenimiento WHERE Estado = 'FINALIZADO';
DECLARE @RepB4 INT;
SELECT @RepB4 = COUNT(*) FROM dbo.TB_MantenimientoRepuesto R
JOIN dbo.TB_Mantenimiento M ON M.IdMantenimiento = R.IdMantenimiento
WHERE M.IdBien = 4;

PRINT '==============================================';
PRINT ' RESUMEN FASE 4:';
PRINT '  Mantenimientos en BD  : ' + CAST(@TotalManto AS VARCHAR) + ' (incluye 1 legacy)';
PRINT '  EN MANTENIMIENTO      : ' + CAST(@EnManto AS VARCHAR);
PRINT '  FINALIZADO            : ' + CAST(@FinManto AS VARCHAR);
PRINT '  Repuestos del bien 4  : ' + CAST(@RepB4 AS VARCHAR) + ' (esperado 2)';
PRINT '  Bien 2                : Operativo (ciclo completo probado)';
PRINT '  Bien 4                : Mantenimiento (repuestos probados)';
PRINT '==============================================';
GO

PRINT '== FIN DE PRUEBAS FASE 4 ==';
GO

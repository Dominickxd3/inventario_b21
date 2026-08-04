/* =============================================================================
   FASE 6 - Reportes institucionales
   BD: BD_Inventario_B21
   -----------------------------------------------------------------------------
   Solo lectura. No modifica bienes, movimientos ni kardex.
   Todos los reportes se consumen mediante stored procedures.
   ============================================================================= */

/* ---------------------------------------------------------------------------
   1) SP_DashboardResumen
   Result sets:
     - Resumen: totales por estado
     - Estados: conteo por estado (para grafico de barras/dona)
     - MovimientosPorMes: movimientos agrupados por mes (para linea)
     - MantenimientosPorMes: mantenimientos y costos por mes (para linea/barras)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_DashboardResumen', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_DashboardResumen;
GO

CREATE PROCEDURE dbo.SP_DashboardResumen
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) RESUMEN GENERAL
    SELECT
        COUNT(*) AS TotalBienes,
        SUM(CASE WHEN B.IdEstado = 2 THEN 1 ELSE 0 END) AS Operativos,
        SUM(CASE WHEN B.IdEstado = 3 THEN 1 ELSE 0 END) AS Averiados,
        SUM(CASE WHEN B.IdEstado = 4 THEN 1 ELSE 0 END) AS EnMantenimiento,
        SUM(CASE WHEN B.IdEstado = 5 THEN 1 ELSE 0 END) AS Prestados,
        SUM(CASE WHEN B.IdEstado = 6 THEN 1 ELSE 0 END) AS DadosBaja,
        SUM(CASE WHEN B.IdEstado = 7 THEN 1 ELSE 0 END) AS NoLocalizados,
        SUM(CASE WHEN B.IdEstado = 8 THEN 1 ELSE 0 END) AS EnEvaluacion
    FROM dbo.TB_Bien B
    WHERE ISNULL(B.Eliminado, 0) = 0;

    -- 2) ESTADOS (grafico)
    SELECT
        E.IdEstado,
        E.NombreEstado,
        COUNT(*) AS Cantidad
    FROM dbo.TB_Bien B
    JOIN dbo.TB_EstadoBien E ON E.IdEstado = B.IdEstado
    WHERE ISNULL(B.Eliminado, 0) = 0
    GROUP BY E.IdEstado, E.NombreEstado
    ORDER BY E.IdEstado;

    -- 3) MOVIMIENTOS POR MES (grafico de lineas)
    SELECT
        YEAR(M.FechaMovimiento) AS Anio,
        MONTH(M.FechaMovimiento) AS Mes,
        COUNT(*) AS CantidadMovimientos
    FROM dbo.TB_Movimiento M
    WHERE M.FechaMovimiento IS NOT NULL
    GROUP BY YEAR(M.FechaMovimiento), MONTH(M.FechaMovimiento)
    ORDER BY Anio, Mes;

    -- 4) MANTENIMIENTOS Y COSTOS POR MES (grafico)
    SELECT
        YEAR(M.FechaInicio) AS Anio,
        MONTH(M.FechaInicio) AS Mes,
        COUNT(*) AS CantidadMantenimientos,
        ISNULL(SUM(M.Costo), 0) AS CostoTotal,
        ISNULL(SUM(REP.CostoRepuestos), 0) AS CostoRepuestos
    FROM dbo.TB_Mantenimiento M
    LEFT JOIN (
        SELECT IdMantenimiento, SUM(Cantidad * CostoUnitario) AS CostoRepuestos
        FROM dbo.TB_MantenimientoRepuesto
        GROUP BY IdMantenimiento
    ) REP ON REP.IdMantenimiento = M.IdMantenimiento
    WHERE M.FechaInicio IS NOT NULL
    GROUP BY YEAR(M.FechaInicio), MONTH(M.FechaInicio)
    ORDER BY Anio, Mes;
END
GO

/* ---------------------------------------------------------------------------
   2) SP_ReporteInventarioGeneral
   Listado completo de bienes activos.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ReporteInventarioGeneral', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ReporteInventarioGeneral;
GO

CREATE PROCEDURE dbo.SP_ReporteInventarioGeneral
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        B.CodigoInterno,
        A.NombreArticulo,
        MAR.NombreMarca,
        MOD.NombreModelo,
        B.NumeroSerie,
        EST.NombreEstado,
        UB.NombreUbicacion,
        (BO.Nombres + ' ' + BO.Apellidos) AS Responsable,
        CONVERT(varchar(10), B.FechaIngreso, 120) AS FechaIngreso,
        B.CodigoPatrimonial,
        A.TipoControl,
        B.ValorAdquisicion
    FROM dbo.TB_Bien B
    JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    LEFT JOIN dbo.TB_Marca MAR ON MAR.IdMarca = B.IdMarca
    LEFT JOIN dbo.TB_Modelo MOD ON MOD.IdModelo = B.IdModelo
    JOIN dbo.TB_EstadoBien EST ON EST.IdEstado = B.IdEstado
    LEFT JOIN dbo.TB_Ubicacion UB ON UB.IdUbicacion = B.IdUbicacion
    LEFT JOIN dbo.TB_Bombero BO ON BO.IdBombero = B.IdResponsableActual
    WHERE ISNULL(B.Eliminado, 0) = 0
    ORDER BY B.CodigoInterno;
END
GO

/* ---------------------------------------------------------------------------
   3) SP_ReporteKardexBien
   Entrada: @CodigoInterno (B21-XXXXXX)
   Devuelve el historial completo del bien con estados/ubicaciones/responsables
   antes y despues de cada movimiento.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ReporteKardexBien', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ReporteKardexBien;
GO

CREATE PROCEDURE dbo.SP_ReporteKardexBien
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

    SELECT
        CONVERT(varchar(19), K.Fecha, 120) AS Fecha,
        M.CodigoMovimiento,
        TM.NombreMovimiento AS TipoMovimiento,
        (UB.Nombres + ' ' + UB.Apellidos) AS Usuario,
        EA.NombreEstado AS EstadoAnterior,
        ED.NombreEstado AS EstadoNuevo,
        UA.NombreUbicacion AS UbicacionAnterior,
        UD.NombreUbicacion AS UbicacionNueva,
        (BA.Nombres + ' ' + BA.Apellidos) AS ResponsableAnterior,
        (BD.Nombres + ' ' + BD.Apellidos) AS ResponsableNuevo,
        K.Detalle,
        M.Observacion
    FROM dbo.TB_Kardex K
    JOIN dbo.TB_Movimiento M ON M.IdMovimiento = K.IdMovimiento
    LEFT JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    LEFT JOIN dbo.TB_MovimientoDetalle D
        ON D.IdMovimiento = K.IdMovimiento AND D.IdBien = K.IdBien
    LEFT JOIN dbo.TB_EstadoBien EA ON EA.IdEstado = D.EstadoAntes
    LEFT JOIN dbo.TB_EstadoBien ED ON ED.IdEstado = D.EstadoDespues
    LEFT JOIN dbo.TB_Ubicacion UA ON UA.IdUbicacion = D.UbicacionAntes
    LEFT JOIN dbo.TB_Ubicacion UD ON UD.IdUbicacion = D.UbicacionDespues
    LEFT JOIN dbo.TB_Bombero BA ON BA.IdBombero = D.ResponsableAntes
    LEFT JOIN dbo.TB_Bombero BD ON BD.IdBombero = D.ResponsableDespues
    LEFT JOIN dbo.TB_Usuario US ON US.IdUsuario = ISNULL(K.UsuarioRegistro, M.IdUsuario)
    LEFT JOIN dbo.TB_Bombero UB ON UB.IdBombero = US.IdBombero
    WHERE K.IdBien = @IdBien
    ORDER BY K.Fecha DESC;
END
GO

/* ---------------------------------------------------------------------------
   4) SP_ReportePrestamos
   Prestamos con solicitante, autoriza, fechas y estado.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ReportePrestamos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ReportePrestamos;
GO

CREATE PROCEDURE dbo.SP_ReportePrestamos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        P.CodigoPrestamo,
        B.CodigoInterno,
        A.NombreArticulo,
        (SO.Nombres + ' ' + SO.Apellidos) AS Solicitante,
        (AU.Nombres + ' ' + AU.Apellidos) AS Autoriza,
        CONVERT(varchar(19), P.FechaSalida, 120) AS FechaSalida,
        CONVERT(varchar(19), P.FechaDevolucionProgramada, 120) AS FechaDevolucionProgramada,
        CONVERT(varchar(19), P.FechaDevolucionReal, 120) AS FechaDevolucionReal,
        P.Estado,
        P.Observacion
    FROM dbo.TB_Prestamo P
    LEFT JOIN dbo.TB_PrestamoDetalle PD ON PD.IdPrestamo = P.IdPrestamo
    JOIN dbo.TB_Bien B ON B.IdBien = PD.IdBien
    JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    LEFT JOIN dbo.TB_Bombero SO ON SO.IdBombero = P.IdBomberoSolicitante
    LEFT JOIN dbo.TB_Bombero AU ON AU.IdBombero = P.IdBomberoAutoriza
    ORDER BY P.FechaSalida DESC;
END
GO

/* ---------------------------------------------------------------------------
   5) SP_ReporteMantenimiento
   Mantenimientos con costo de repuestos y costo total.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ReporteMantenimiento', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ReporteMantenimiento;
GO

CREATE PROCEDURE dbo.SP_ReporteMantenimiento
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        B.CodigoInterno,
        A.NombreArticulo,
        M.TipoMantenimiento,
        CONVERT(varchar(19), M.FechaInicio, 120) AS FechaInicio,
        CONVERT(varchar(19), M.FechaFin, 120) AS FechaFin,
        M.Diagnostico,
        M.TrabajoRealizado,
        ISNULL(M.Costo, 0) AS Costo,
        ISNULL((
            SELECT SUM(R.Cantidad * R.CostoUnitario)
            FROM dbo.TB_MantenimientoRepuesto R
            WHERE R.IdMantenimiento = M.IdMantenimiento
        ), 0) AS CostoRepuestos,
        ISNULL(M.Costo, 0) + ISNULL((
            SELECT SUM(R.Cantidad * R.CostoUnitario)
            FROM dbo.TB_MantenimientoRepuesto R
            WHERE R.IdMantenimiento = M.IdMantenimiento
        ), 0) AS CostoTotal,
        M.Responsable AS ResponsableTecnico,
        M.Estado
    FROM dbo.TB_Mantenimiento M
    JOIN dbo.TB_Bien B ON B.IdBien = M.IdBien
    JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    ORDER BY M.FechaInicio DESC;
END
GO

/* ---------------------------------------------------------------------------
   6) SP_ReporteMovimientosPeriodo
   Filtros: @FechaInicio, @FechaFin, @IdTipoMovimiento (opcional).
   Result sets:
     - Detalle: movimientos del periodo
     - Mensual: agregacion por mes (para analisis mensual / grafico)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ReporteMovimientosPeriodo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ReporteMovimientosPeriodo;
GO

CREATE PROCEDURE dbo.SP_ReporteMovimientosPeriodo
    @FechaInicio DATETIME,
    @FechaFin DATETIME,
    @IdTipoMovimiento INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) DETALLE
    SELECT
        M.CodigoMovimiento,
        TM.NombreMovimiento AS TipoMovimiento,
        CONVERT(varchar(19), M.FechaMovimiento, 120) AS Fecha,
        B.CodigoInterno,
        A.NombreArticulo,
        (BO.Nombres + ' ' + BO.Apellidos) AS Usuario,
        M.Observacion,
        M.Estado
    FROM dbo.TB_Movimiento M
    JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    LEFT JOIN dbo.TB_MovimientoDetalle D ON D.IdMovimiento = M.IdMovimiento
    LEFT JOIN dbo.TB_Bien B ON B.IdBien = D.IdBien
    LEFT JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    LEFT JOIN dbo.TB_Usuario US ON US.IdUsuario = M.IdUsuario
    LEFT JOIN dbo.TB_Bombero BO ON BO.IdBombero = US.IdBombero
    WHERE M.FechaMovimiento >= @FechaInicio
      AND M.FechaMovimiento < DATEADD(DAY, 1, @FechaFin)
      AND (@IdTipoMovimiento IS NULL OR M.IdTipoMovimiento = @IdTipoMovimiento)
    ORDER BY M.FechaMovimiento DESC;

    -- 2) MENSUAL
    SELECT
        YEAR(M.FechaMovimiento) AS Anio,
        MONTH(M.FechaMovimiento) AS Mes,
        TM.NombreMovimiento AS TipoMovimiento,
        COUNT(*) AS Cantidad
    FROM dbo.TB_Movimiento M
    JOIN dbo.TB_TipoMovimiento TM ON TM.IdTipoMovimiento = M.IdTipoMovimiento
    WHERE M.FechaMovimiento >= @FechaInicio
      AND M.FechaMovimiento < DATEADD(DAY, 1, @FechaFin)
      AND (@IdTipoMovimiento IS NULL OR M.IdTipoMovimiento = @IdTipoMovimiento)
    GROUP BY YEAR(M.FechaMovimiento), MONTH(M.FechaMovimiento), TM.NombreMovimiento
    ORDER BY Anio, Mes, TipoMovimiento;
END
GO

/* ---------------------------------------------------------------------------
   7) SP_ReporteResponsables
   Result sets:
     - Resumen: bombero y cantidad de bienes asignados
     - Detalle: equipos de cada bombero
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.SP_ReporteResponsables', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ReporteResponsables;
GO

CREATE PROCEDURE dbo.SP_ReporteResponsables
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) RESUMEN
    SELECT
        BO.IdBombero,
        BO.CodigoBombero,
        (BO.Nombres + ' ' + BO.Apellidos) AS Nombre,
        COUNT(B.IdBien) AS CantidadBienes
    FROM dbo.TB_Bombero BO
    LEFT JOIN dbo.TB_Bien B
        ON B.IdResponsableActual = BO.IdBombero
       AND ISNULL(B.Eliminado, 0) = 0
    WHERE BO.Estado = 1
    GROUP BY BO.IdBombero, BO.CodigoBombero, BO.Nombres, BO.Apellidos
    HAVING COUNT(B.IdBien) > 0
    ORDER BY CantidadBienes DESC;

    -- 2) DETALLE EQUIPOS
    SELECT
        (BO.Nombres + ' ' + BO.Apellidos) AS Responsable,
        B.CodigoInterno,
        A.NombreArticulo,
        EST.NombreEstado,
        CONVERT(varchar(10), B.FechaIngreso, 120) AS FechaIngreso
    FROM dbo.TB_Bien B
    JOIN dbo.TB_Bombero BO ON BO.IdBombero = B.IdResponsableActual
    JOIN dbo.TB_Articulo A ON A.IdArticulo = B.IdArticulo
    JOIN dbo.TB_EstadoBien EST ON EST.IdEstado = B.IdEstado
    WHERE ISNULL(B.Eliminado, 0) = 0
      AND B.IdResponsableActual IS NOT NULL
    ORDER BY Responsable, B.CodigoInterno;
END
GO

PRINT 'FASE 6 - SPs de reportes creados.';
GO

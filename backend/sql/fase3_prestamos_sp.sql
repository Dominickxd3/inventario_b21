/* ============================================================
   FASE 3 - SPs de consulta de prestamos (adicionales)
   SP_ListarPrestamos y SP_ObtenerPrestamo
   ============================================================ */
SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.SP_ListarPrestamos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ListarPrestamos;
GO
CREATE PROCEDURE dbo.SP_ListarPrestamos
    @Filtro VARCHAR(100) = NULL,
    @Estado VARCHAR(30) = NULL,
    @IdBien INT = NULL,
    @Pagina INT = 1,
    @Filas INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Pagina - 1) * @Filas;

    SELECT P.IdPrestamo, P.CodigoPrestamo,
           P.FechaSalida, P.FechaDevolucionProgramada, P.FechaDevolucionReal,
           P.IdBomberoSolicitante,
           BS.Nombres + ' ' + BS.Apellidos AS Solicitante,
           P.IdBomberoAutoriza,
           BA.Nombres + ' ' + BA.Apellidos AS Autoriza,
           P.Estado, P.Observacion,
           PD.IdBien, B.CodigoInterno
    FROM dbo.TB_Prestamo P
    JOIN dbo.TB_Bombero BS ON BS.IdBombero = P.IdBomberoSolicitante
    LEFT JOIN dbo.TB_Bombero BA ON BA.IdBombero = P.IdBomberoAutoriza
    LEFT JOIN dbo.TB_PrestamoDetalle PD ON PD.IdPrestamo = P.IdPrestamo
    LEFT JOIN dbo.TB_Bien B ON B.IdBien = PD.IdBien
    WHERE (@Filtro IS NULL
           OR P.CodigoPrestamo LIKE '%' + @Filtro + '%'
           OR B.CodigoInterno LIKE '%' + @Filtro + '%'
           OR BS.Nombres LIKE '%' + @Filtro + '%'
           OR BS.Apellidos LIKE '%' + @Filtro + '%')
      AND (@Estado IS NULL OR P.Estado = @Estado)
      AND (@IdBien IS NULL OR PD.IdBien = @IdBien)
    ORDER BY P.IdPrestamo DESC
    OFFSET @Offset ROWS FETCH NEXT @Filas ROWS ONLY;

    SELECT COUNT(*) AS Total
    FROM dbo.TB_Prestamo P
    JOIN dbo.TB_Bombero BS ON BS.IdBombero = P.IdBomberoSolicitante
    LEFT JOIN dbo.TB_PrestamoDetalle PD ON PD.IdPrestamo = P.IdPrestamo
    LEFT JOIN dbo.TB_Bien B ON B.IdBien = PD.IdBien
    WHERE (@Filtro IS NULL
           OR P.CodigoPrestamo LIKE '%' + @Filtro + '%'
           OR B.CodigoInterno LIKE '%' + @Filtro + '%'
           OR BS.Nombres LIKE '%' + @Filtro + '%'
           OR BS.Apellidos LIKE '%' + @Filtro + '%')
      AND (@Estado IS NULL OR P.Estado = @Estado)
      AND (@IdBien IS NULL OR PD.IdBien = @IdBien);
END;
GO

IF OBJECT_ID('dbo.SP_ObtenerPrestamo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_ObtenerPrestamo;
GO
CREATE PROCEDURE dbo.SP_ObtenerPrestamo
    @IdPrestamo INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Prestamo WHERE IdPrestamo = @IdPrestamo)
    BEGIN
        RAISERROR('El préstamo no existe.', 16, 1);
        RETURN;
    END

    SELECT P.IdPrestamo, P.CodigoPrestamo,
           P.FechaSalida, P.FechaDevolucionProgramada, P.FechaDevolucionReal,
           P.IdBomberoSolicitante,
           BS.Nombres + ' ' + BS.Apellidos AS Solicitante,
           P.IdBomberoAutoriza,
           BA.Nombres + ' ' + BA.Apellidos AS Autoriza,
           P.Estado, P.Observacion
    FROM dbo.TB_Prestamo P
    JOIN dbo.TB_Bombero BS ON BS.IdBombero = P.IdBomberoSolicitante
    LEFT JOIN dbo.TB_Bombero BA ON BA.IdBombero = P.IdBomberoAutoriza
    WHERE P.IdPrestamo = @IdPrestamo;

    SELECT PD.IdDetallePrestamo, PD.IdBien, B.CodigoInterno, PD.EstadoSalida,
           D.IdDevolucion, D.FechaDevolucion,
           D.IdBomberoRecibe, BR.Nombres + ' ' + BR.Apellidos AS Recibe,
           D.EstadoRecepcion, D.Observacion AS ObservacionDevolucion
    FROM dbo.TB_PrestamoDetalle PD
    JOIN dbo.TB_Bien B ON B.IdBien = PD.IdBien
    LEFT JOIN dbo.TB_Devolucion D ON D.IdPrestamo = PD.IdPrestamo
    LEFT JOIN dbo.TB_Bombero BR ON BR.IdBombero = D.IdBomberoRecibe
    WHERE PD.IdPrestamo = @IdPrestamo;
END;
GO

PRINT 'SP de prestamos creados correctamente.';
GO

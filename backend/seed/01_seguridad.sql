/* =============================================================================
   seed/01_seguridad.sql
   -----------------------------------------------------------------------------
   Sistema de Inventario y Trazabilidad - Compañía de Bomberos Rímac N°21 (B21)
   FASE 1: Seguridad inicial
   -----------------------------------------------------------------------------
   Contenido:
     - Usuario administrador inicial (con hash bcrypt).
     - Asignación del rol Administrador al usuario admin.
     - Mapeo Rol-Permiso para los 5 roles del sistema.

   Contraseña inicial del usuario 'admin':  AdminB21#2026
   (DEBE cambiarse en el primer acceso. El hash es bcrypt rounds=10.)
   ============================================================================= */

USE BD_Inventario_B21;
GO

SET NOCOUNT ON;
GO

-- =============================================================================
-- 1) BOMBERO BASE (si no existe ninguno)
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.TB_Bombero)
BEGIN
    INSERT INTO dbo.TB_Bombero (CodigoBombero, DNI, Nombres, Apellidos, IdCargo, FechaIngreso, Estado, FechaRegistro)
    VALUES ('BOM-000001', '00000000', 'ADMINISTRADOR', 'SISTEMA', NULL, GETDATE(), 1, GETDATE());
END

DECLARE @IdBombero INT = (SELECT TOP 1 IdBombero FROM dbo.TB_Bombero ORDER BY IdBombero);
GO

-- =============================================================================
-- 2) USUARIO ADMINISTRADOR
-- =============================================================================
DECLARE @IdBombero INT = (SELECT TOP 1 IdBombero FROM dbo.TB_Bombero ORDER BY IdBombero);

IF NOT EXISTS (SELECT 1 FROM dbo.TB_Usuario WHERE Usuario = 'admin')
BEGIN
    INSERT INTO dbo.TB_Usuario (IdBombero, Usuario, PasswordHash, Estado, UltimoAcceso, FechaRegistro)
    VALUES (@IdBombero, 'admin', '$2b$10$Pkm/bKIqHG.3LtHO0zzbH.VxWsz4yIzx5xRnPgXB3snmxAOXw95gu', 1, NULL, GETDATE());
    PRINT 'Usuario admin creado.';
END
ELSE
BEGIN
    PRINT 'Usuario admin ya existía.';
END

DECLARE @IdUsuario INT = (SELECT IdUsuario FROM dbo.TB_Usuario WHERE Usuario = 'admin');
GO

-- =============================================================================
-- 3) ASIGNACIÓN ROL ADMINISTRADOR (IdRol = 1)
-- =============================================================================
DECLARE @IdUsuario INT = (SELECT IdUsuario FROM dbo.TB_Usuario WHERE Usuario = 'admin');

IF NOT EXISTS (SELECT 1 FROM dbo.TB_UsuarioRol WHERE IdUsuario = @IdUsuario AND IdRol = 1)
BEGIN
    INSERT INTO dbo.TB_UsuarioRol (IdUsuario, IdRol)
    VALUES (@IdUsuario, 1);
    PRINT 'Rol Administrador asignado a admin.';
END
GO

-- =============================================================================
-- 4) MAPEO ROL-PERMISO (idempotente)
--    Permisos existentes: 1..9
--    Roles: 1 Administrador | 2 Almacenero | 3 Auditor | 4 Comandancia | 5 Consulta
-- =============================================================================
;WITH Mapeo(IdRol, IdPermiso) AS
(
    SELECT IdRol, IdPermiso FROM (VALUES
        (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),   -- Administrador: todo
        (2,1),(2,2),(2,3),(2,4),(2,5),                            -- Almacenero: inventario + prestamos/devoluciones
        (3,3),(3,8),                                              -- Auditor: solo lectura + reportes
        (4,3),(4,4),(4,5),(4,8),                                  -- Comandancia: lectura + prestamos + reportes
        (5,3),(5,8)                                               -- Consulta: lectura + reportes
    ) AS v(IdRol, IdPermiso)
    WHERE EXISTS (SELECT 1 FROM dbo.TB_Rol r WHERE r.IdRol = v.IdRol)
      AND EXISTS (SELECT 1 FROM dbo.TB_Permiso p WHERE p.IdPermiso = v.IdPermiso)
)
INSERT INTO dbo.TB_RolPermiso (IdRol, IdPermiso)
SELECT m.IdRol, m.IdPermiso
FROM Mapeo m
WHERE NOT EXISTS (SELECT 1 FROM dbo.TB_RolPermiso rp WHERE rp.IdRol = m.IdRol AND rp.IdPermiso = m.IdPermiso);

SELECT 'admin' AS Usuario, R.NombreRol AS Rol, COUNT(RP.IdPermiso) AS Permisos
FROM dbo.TB_Usuario U
JOIN dbo.TB_UsuarioRol UR ON U.IdUsuario = UR.IdUsuario
JOIN dbo.TB_Rol R ON R.IdRol = UR.IdRol
LEFT JOIN dbo.TB_RolPermiso RP ON RP.IdRol = R.IdRol
WHERE U.Usuario = 'admin'
GROUP BY R.NombreRol;

PRINT 'Seed de seguridad aplicado. Contraseña inicial: AdminB21#2026';
GO

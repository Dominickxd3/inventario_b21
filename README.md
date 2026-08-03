# Sistema de Inventario y Trazabilidad B21

## Compañía de Bomberos Rímac N°21


## Descripción

Sistema institucional web para la gestión integral de inventario, trazabilidad y ciclo de vida de equipos pertenecientes a la Compañía de Bomberos Rímac N°21.

El objetivo principal es conocer en todo momento:

- Qué equipos existen.
- Dónde se encuentran.
- Quién es responsable actualmente.
- Quién tuvo anteriormente el equipo.
- Qué movimientos realizó.
- Qué mantenimientos recibió.
- Qué documentos y evidencias posee.


El sistema no es un simple CRUD de inventario.

Está diseñado como un sistema de trazabilidad patrimonial.


Ejemplo de ciclo de vida:


B21-000001

Ingreso

↓

Asignación

↓

Préstamo

↓

Devolución

↓

Mantenimiento

↓

Transferencia

↓

Baja



---

# Estado del proyecto


## FASE 1 — Seguridad

Estado:

COMPLETADO


Incluye:


- Autenticación JWT.
- Usuarios.
- Roles.
- Permisos.
- Sesiones.
- Auditoría de accesos.
- Bcrypt para contraseñas.


Roles implementados:


1. Administrador

2. Almacenero

3. Auditor

4. Comandancia

5. Consulta



---

# FASE 2 — Inventario y Bienes

Estado:

COMPLETADO


Incluye:


- Artículos.
- Bienes físicos.
- Código interno B21.
- Estados.
- Ubicaciones.
- Responsables.
- Relaciones padre/hijo.
- QR.
- Ficha técnica.


Regla principal:


El código interno es único e inmutable.


Formato:


B21-000001



Nunca debe cambiar durante la vida del activo.



---

# FASE 3 — Movimientos y Trazabilidad

Estado:

COMPLETADO


Incluye:


- Movimientos.
- Detalle de movimientos.
- Kardex.
- Préstamos.
- Devoluciones.
- Transferencias.
- Historial de responsables.
- Historial de estados.



Cada operación genera:


- Movimiento.
- Detalle.
- Kardex.
- Historial correspondiente.



No se elimina información histórica.



---

# FASE 4 — Mantenimiento

Estado:

COMPLETADO


Incluye:


- Registro mantenimiento.
- Finalización mantenimiento.
- Diagnóstico.
- Trabajo realizado.
- Repuestos usados.
- Costos.
- Historial técnico.


Flujo:


Operativo

↓

Averiado

↓

Mantenimiento

↓

Operativo



Los repuestos están normalizados:


TB_Mantenimiento

|

|

TB_MantenimientoRepuesto



---

# FASE 5 — Fotos y Documentos

Estado:

COMPLETADO


Incluye:


- Fotografías por bien.
- Documentos por bien (PDF, DOC, DOCX, XLS, XLSX).
- Actas.
- Informes.
- Certificados.
- Compresión de imágenes con Sharp.
- Google Drive (modo real con service account o simulado sin credenciales).
- Soft delete de fotos (nunca se borran físicamente).


Arquitectura de subida:


Multer

↓

Sharp (máx. 1600px, JPEG calidad 78)

↓

Google Drive API (B21_INVENTARIO / Bienes / B21-XXXXXX / Fotos|Documentos)

↓

SQL Server (solo metadatos)


Regla:


No guardar archivos dentro de SQL Server.


SQL guarda únicamente:


- Nombre del archivo.
- ID en Google Drive.
- Ruta / URL.
- Tipo.
- Tamaño original y comprimido.
- Resolución original y final.
- Fecha y usuario de carga.


Tipos de documento (TB_TipoDocumento):


1. Acta de entrega (ACT-ENT)

2. Acta de devolución (ACT-DEV)

3. Formato préstamo (PRE)

4. Reporte inventario (INV)

5. Informe mantenimiento (MAN)

6. Informe baja (BAJ)

7. Reporte kardex (KAR)

8. Certificado (CERT)

9. Otro (OTR)



---

# Próximas fases


## FASE 6 — Reportes


Pendiente:


- Dashboard.
- Inventario general.
- Kardex.
- Historial equipos.
- Reportes PDF.
- Exportación Excel.



---

## FASE 7 — Frontend


Tecnología:


React

TypeScript

Vite

Tailwind CSS



Módulos:


- Login.
- Dashboard.
- Inventario.
- Kardex.
- Préstamos.
- Mantenimiento.
- Reportes.



---

# Stack tecnológico


## Backend

NestJS

TypeScript


## Base de datos

SQL Server 2014


Acceso:

Procedimientos almacenados.


No usar ORM.



## Archivos

Google Drive API



## Servidor

Windows Server 2019

PM2



## Control versiones

Git

GitHub



---

# Arquitectura


Frontend

↓

NestJS API

↓

Services

↓

Database Provider

↓

Stored Procedures

↓

SQL Server



---

# Base de datos

Base de datos:

BD_Inventario_B21

Motor:

SQL Server 2014

Acceso:

Solo procedimientos almacenados.

No usar ORM.

Los scripts se ejecutan en orden y quedan respaldados en backend/sql/:

- fase2_inventario.sql (inventario, bienes, QR, ficha).

- fase3_movimientos.sql (movimientos, kardex).

- fase3_prestamos_sp.sql (préstamos, devoluciones, transferencias).

- fase4_mantenimiento.sql (mantenimiento + repuestos).

- fase5_archivos.sql (fotos, documentos, Google Drive).

- faseN_pruebas.sql (pruebas de cada fase).


## Tablas principales

Seguridad y usuarios:

- TB_Usuario

- TB_Rol

- TB_Permiso

- TB_RolPermiso

- TB_UsuarioRol

- TB_SesionUsuario

- TB_LogAccesoWeb

- TB_Auditoria

- TB_AuditoriaDetalle

- TB_BitacoraSistema

- TB_TokenAPI


Catálogos:

- TB_Articulo

- TB_Marca

- TB_Modelo

- TB_Cargo

- TB_Bombero

- TB_EstadoBien

- TB_TipoMovimiento

- TB_TipoMantenimiento

- TB_TipoDocumento

- TB_TipoBaja

- TB_Ubicacion

- TB_Configuracion

- TB_ReglaNegocio


Inventario y trazabilidad:

- TB_Bien

- TB_BienRelacion

- TB_QR_Bien

- TB_QRGenerado

- TB_HistorialAsignacion

- TB_HistorialEstadoBien

- TB_Movimiento

- TB_MovimientoDetalle

- TB_Kardex

- TB_Prestamo

- TB_PrestamoDetalle

- TB_Devolucion

- TB_Baja

- TB_Inventario

- TB_InventarioDetalle

- TB_ImportacionInventario


Mantenimiento:

- TB_Mantenimiento

- TB_MantenimientoRepuesto


Fotos y documentos (metadatos, nunca binarios):

- TB_FotoBien

- TB_Foto (legacy)

- TB_Documento

- TB_PlantillaDocumento

- TB_PlantillaPDF

- TB_DocumentoGenerado

- TB_ColaDocumento

- TB_Firma

- TB_EscaneoQR


Emergencias y alertas:

- TB_ServicioEmergencia

- TB_TipoEmergencia

- TB_ServicioDetalle

- TB_Alerta


## Procedimientos almacenados

Seguridad:

- SP_LoginUsuario

- SP_RegistrarSesion

- SP_CerrarSesion

- SP_ObtenerUsuarioLogin

- SP_RegistrarAccesoWeb


Inventario:

- SP_ListarCatalogos

- SP_RegistrarArticulo

- SP_ActualizarArticulo

- SP_ListarArticulos

- SP_RegistrarBien

- SP_ActualizarBien

- SP_ListarBienes

- SP_EliminarBien (lógico, controlado por TB_Configuracion)

- SP_CambiarEstadoSeguro

- SP_AsignarBienSeguro

- SP_CambiarUbicacionBien

- SP_RegistrarQRBien

- SP_ConsultarQR

- SP_RegistrarEscaneoQR

- SP_ObtenerFichaBien


Movimientos:

- SP_RegistrarMovimiento

- SP_ListarMovimientos

- SP_ObtenerMovimiento

- SP_ObtenerKardexBien

- SP_CrearPrestamo

- SP_RegistrarPrestamo

- SP_ListarPrestamos

- SP_ObtenerPrestamo

- SP_RegistrarDevolucion

- SP_TransferirBien


Mantenimiento:

- SP_RegistrarMantenimiento

- SP_FinalizarMantenimiento

- SP_ListarMantenimientos

- SP_ObtenerMantenimiento


Fotos y documentos:

- SP_RegistrarFotoBien

- SP_ListarFotosBien

- SP_CambiarEstadoFoto

- SP_RegistrarDocumentoBien

- SP_ListarDocumentosBien

- SP_ListarTiposDocumento


Reportes y consultas:

- SP_DashboardInventario

- SP_ReporteEstados

- SP_EquiposBombero

- SP_EquiposSinResponsable


## Reglas de la BD


- El código interno B21-XXXXXX es único e inmutable.

- Todo cambio de estado, asignación o ubicación genera historial.

- Todo movimiento genera kardex; nunca se elimina histórico.

- Fotos y documentos: SQL guarda solo metadatos (nombre, ID Drive, ruta, tamaño, fecha, usuario).

- Eliminación de bienes es lógica y está bloqueada por configuración.

- Validaciones vía RAISERROR compatibles con el traductor SQL → HTTP (404/409/400).



---

# Reglas críticas


## No modificar sin aprobación


- Arquitectura BD.
- Tablas existentes.
- SP existentes.
- Triggers existentes.



## Historial


Nunca eliminar:


- Movimientos.
- Kardex.
- Préstamos.
- Devoluciones.
- Mantenimiento.



## Código B21


Nunca modificar.



## Fotos


Nunca almacenar imágenes en SQL.



Guardar solamente:


- Ruta.
- ID Drive.
- Nombre.
- Tamaño.
- Fecha.



---

# Estructura Backend


src/


auth/

usuarios/

roles/

inventario/

movimientos/

mantenimiento/

archivos/

common/

database/



---

# Metodología de desarrollo


Siempre:


1. Analizar BD existente.

2. Proponer arquitectura.

3. Crear SQL.

4. Ejecutar pruebas.

5. Crear backend.

6. Validar endpoints.

7. Documentar cambios.



No crear código directamente sin analizar.



---

# Última actualización


Estado actual:

FASE 5 completada.


Siguiente trabajo:

FASE 6 — Reportes (Dashboard, inventario general, kardex, reportes PDF y Excel).


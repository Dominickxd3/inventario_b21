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

# Próximas fases


## FASE 5 — Fotos y Documentos

Estado:

PENDIENTE


Objetivo:


Agregar evidencia documental del activo.


Incluye:


- Fotografías.
- Documentos PDF.
- Actas.
- Informes.
- Certificados.


Arquitectura:


Multer

↓

Sharp

↓

Google Drive API

↓

SQL Server (metadatos)



No guardar archivos dentro de SQL Server.



---

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

FASE 4 completada.


Siguiente trabajo:

FASE 5 — Fotos y Documentos.


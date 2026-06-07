# 1. INTRODUCCIÓN

## 1.1. Propósito del Documento

El presente **Manual Técnico del Sistema** constituye el documento normativo e instructivo oficial del proyecto de grado denominado **Handler TrackSamples**, desarrollado para la Facultad de Ingeniería de Sistemas de la institución, en el marco del proceso de evaluación de la Unidad para el Desarrollo de la Ciencia, la Investigación y la Innovación (UDCII).

Este manual está dirigido exclusivamente al personal técnico especializado: ingenieros de software, administradores de bases de datos relacionales, profesionales de infraestructura y soporte de Tecnologías de la Información (TI). Su contenido presupone un conocimiento previo en arquitecturas de software Cliente-Servidor, lenguaje SQL, ecosistemas Node.js y programación orientada a componentes con React.

El objetivo primordial de este documento es proporcionar al equipo técnico un conocimiento exhaustivo de:
- La arquitectura de software interna del aplicativo y sus tres capas fundamentales.
- El esquema relacional completo de la base de datos PostgreSQL, incluyendo tipos enumerados, triggers, vistas, índices y políticas de seguridad RLS.
- Los doce (12) módulos del backend (API REST) y sus responsabilidades funcionales.
- Los procedimientos detallados de instalación, configuración de variables de entorno, despliegue y verificación del sistema.
- Los mecanismos de protección de datos, incluyendo el sistema de backups automáticos y manuales.
- Las estrategias de diagnóstico y resolución de fallos técnicos.

## 1.2. Alcance del Sistema

**Handler TrackSamples** es un sistema de información empresarial concebido para resolver la problemática de la gestión logística, el control de inventario y el aseguramiento normativo del almacén de muestras químicas bajo los lineamientos del **Sistema Globalmente Armonizado (SGA)** de clasificación y etiquetado de productos químicos (GHS por sus siglas en inglés).

El sistema cubre de manera integral los siguientes procesos institucionales:

| Proceso | Descripción |
|---|---|
| Registro de Inventario | Ingreso de materias primas (bulk) con metadatos GHS completos, CoA y posicionamiento físico en la grilla 3D del anaquel |
| Validación Normativa SGA | Verificación algorítmica de compatibilidad química entre productos en un mismo espacio de almacenamiento |
| Dispensación Logística | Fraccionamiento controlado de muestras bulk en unidades hijas con generación de códigos QR únicos |
| Despacho FEFO | Algoritmo de salida de inventario que prioriza los lotes de mayor riesgo de expiración |
| Trazabilidad Inmutable | Log perpetuo de toda operación ejecutada en el sistema, asociada al usuario y con contexto JSON |
| Visualización Espacial 3D | Renderizado WebGL interactivo de la topología real del almacén usando React Three Fiber y Three.js |
| Administración de Acceso | Control de roles y permisos granulares con autenticación JWT y seguridad RLS en base de datos |
| Salvaguarda de Información | Sistema de copias de seguridad (backups) manuales y automáticos almacenados en la base de datos local |

## 1.3. Convenciones de Nomenclatura

A lo largo de este manual se utilizan las siguientes convenciones:

- `código_fuente` → Fragmentos de código, rutas de archivo, comandos de terminal, nombres de tablas SQL.
- **Negrita** → Términos técnicos de alta relevancia en su primera aparición.
- *Cursiva* → Nombres de módulos o interfaces del sistema.
- > **Nota Técnica:** → Aclaraciones importantes para el personal de TI.

# 2. OBJETIVOS DE LA APLICACIÓN

## 2.1. Contexto del Sistema

**Handler TrackSamples** es un sistema de información de escritorio desarrollado a la medida para solucionar una problemática concreta: la gestión manual, fragmentada e insegura del inventario de materias primas químicas en un almacén industrial. Antes de la existencia de este sistema, los procesos de registro, consulta y control de muestras dependían de hojas de cálculo o registros físicos, con el riesgo de errores humanos, pérdida de información y violaciones involuntarias a las normas internacionales de seguridad química.

El sistema opera **completamente en el computador del usuario**, sin enviar datos a servidores externos. Toda la información de la empresa queda resguardada de forma local y segura.

## 2.2. Objetivos Específicos del Software

La plataforma fue diseñada con los siguientes propósitos institucionales:

### Objetivo 1 — Control Total del Inventario
Proporcionar una plataforma digital centralizada para registrar con exactitud el ingreso de materias primas (muestras globales), documentando sus fechas de fabricación y vencimiento, peso, proveedor, número de lote, y la ubicación física precisa dentro del almacén (fila, columna y nivel del anaquel).

### Objetivo 2 — Cumplimiento Normativo SGA (Sistema Globalmente Armonizado)
Automatizar el cumplimiento de la norma internacional GHS/SGA de clasificación de productos peligrosos. El sistema almacena los pictogramas de peligro de cada sustancia (flamable, corrosivo, tóxico, etc.) y **bloquea activamente** el almacenamiento de sustancias químicamente incompatibles en el mismo espacio físico, protegiendo al personal y a las instalaciones.

### Objetivo 3 — Reducción de Pérdidas por Vencimiento (FEFO)
Implementar de manera sistemática la metodología **First-Expired-First-Out** (Primero en Vencer, Primero en Salir). El sistema determina automáticamente qué frasco debe ser entregado primero al momento de un despacho, eliminando el criterio subjetivo del operario y reduciendo el desperdicio de material costoso.

### Objetivo 4 — Trazabilidad Completa e Inmutable
Mantener un registro histórico permanente e inalterable de cada operación ejecutada en el sistema: quién lo hizo, qué hizo, sobre qué producto y en qué momento exacto. Este historial es fundamental para auditorías de calidad, certificaciones ISO y la reconstrucción de incidentes operativos.

### Objetivo 5 — Subdivisión Controlada (Dispensación)
Gestionar el proceso de fraccionamiento de materias primas desde grandes recipientes (cuñetes, tambores) hacia frascos más pequeños de uso o entrega final, generando automáticamente un código QR único para cada frasco hijo, que puede ser impreso y pegado físicamente en el recipiente para su identificación rápida con un escáner.

### Objetivo 6 — Visualización Espacial del Almacén (3D)
Ofrecer una representación tridimensional interactiva de la planta de almacenamiento, permitiendo al operario identificar visualmente la ubicación exacta de cualquier producto sin necesidad de desplazarse físicamente por la bodega para su búsqueda.

### Objetivo 7 — Protección de la Información (Backups)
Garantizar la continuidad del negocio frente a fallos de hardware o corrupción de datos, mediante un sistema automatizado de copias de seguridad que preserva toda la información de la empresa de forma local y segura.

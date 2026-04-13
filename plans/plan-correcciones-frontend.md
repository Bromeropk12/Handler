# Plan de Correcciones - Frontend Handler TrackSamples

## Fecha: 2026-04-07

---

## Resumen de Problemas Identificados

El usuario reportó los siguientes problemas:

1. **Módulo Muestras Globales (SamplesPage.jsx)**:
   - El botón de filtro no tiene funcionalidad implementada
   - No se muestra el peso por unidad (gramos) de cada muestra global
   - No se muestra información de muestras hijas dispensadas
   - El modal de detalle no muestra datos completos

2. **Módulo Dispensación (DispensingPage.jsx)**:
   - El buscador no encuentra muestras por nombre o lote
   - La respuesta de la API no se está parseando correctamente

---

## Análisis Detallado de Cada Problema

### Problema 1: Botón de Filtro sin Funcionalidad (SamplesPage.jsx)

**Ubicación**: [`frontend/src/modules/samples/SamplesPage.jsx:197`](frontend/src/modules/samples/SamplesPage.jsx:197)

**Código actual**:
```jsx
<button className="btn-ghost">
  <FunnelIcon className="w-4 h-4 mr-2" />
  Filtros
</button>
```

**Problema**: El botón no tiene ningún `onClick` ni estado asociado. Solo existe visualmente.

**Solución**: Implementar un dropdown o modal con opciones de filtro por:
- Línea de mercado
- Clase de peligro SGA
- Estado (activa, vencida, por vencer)
- Proveedor

---

### Problema 2: No se muestra peso por unidad (SamplesPage.jsx)

**Ubicación**: [`frontend/src/modules/samples/SamplesPage.jsx:134-136`](frontend/src/modules/samples/SamplesPage.jsx:134)

**Código actual**:
```jsx
{
  key: 'quantity_grams',
  label: 'Cantidad',
  render: val => <span className="text-gray-300 font-mono text-xs">{val ? `${val}g` : 'N/A'}</span>,
},
```

**Problema**: La columna usa `quantity_grams` pero la BD tiene `weight_per_unit_grams`. Además, no se muestran `total_units` ni `available_units`.

**Solución**: Cambiar la columna para usar `weight_per_unit_grams` y agregar columnas adicionales para unidades totales y disponibles.

---

### Problema 3: Modal de detalle incompleto (SamplesPage.jsx)

**Ubicación**: [`frontend/src/modules/samples/SamplesPage.jsx:333-373`](frontend/src/modules/samples/SamplesPage.jsx:333)

**Problema**: El modal solo muestra datos básicos (nombre, lote, proveedor, SGA, cantidad, estado) pero no muestra:
- Peso por unidad
- Unidades totales
- Unidades disponibles
- Cantidad de muestras hijas dispensadas
- Dimensiones de la muestra

**Solución**: Agregar todos los campos faltantes al modal de detalle.

---

### Problema 4: Buscador de dispensación no funciona (DispensingPage.jsx)

**Ubicación**: [`frontend/src/modules/dispensing/DispensingPage.jsx:27`](frontend/src/modules/dispensing/DispensingPage.jsx:27)

**Código actual**:
```jsx
setGlobalSamples(response.data.data.samples || []);
```

**Problema**: El backend devuelve los datos en `response.data.data.bulkSamples` pero el frontend espera `response.data.data.samples`. Esto hace que la lista esté vacía y el buscador no encuentre nada.

**Solución**: Corregir el parseo de la respuesta para usar `bulkSamples`.

---

## Plan de Implementación

### PRIORIDAD 1: Corregir DispensingPage.jsx (Crítico)

**Archivo**: `frontend/src/modules/dispensing/DispensingPage.jsx`

**Cambios necesarios**:
1. Línea 27: Cambiar `response.data.data.samples` a `response.data.data.bulkSamples || response.data.data.samples || []`
2. Agregar fallback para el filtrado en caso de que los datos vengan vacíos
3. Mejorar el feedback visual cuando no se encuentran resultados

### PRIORIDAD 2: Corregir SamplesPage.jsx (Alto)

**Archivo**: `frontend/src/modules/samples/SamplesPage.jsx`

**Cambios necesarios**:
1. Agregar columna de peso por unidad (`weight_per_unit_grams`)
2. Agregar columna de unidades disponibles (`available_units`)
3. Implementar funcionalidad del botón de filtros
4. Completar el modal de detalle con todos los campos

### PRIORIDAD 3: Mejorar API (Medio)

**Archivo**: `frontend/src/services/api.js`

**Cambios necesarios**:
1. Envolver `samplesAPI` con circuit breaker para consistencia

---

## Estado de las Migraciones de BD

✅ **Todas las migraciones se ejecutaron correctamente:**

| Migración | Estado | Descripción |
|-----------|--------|-------------|
| migration-001 | ✅ Ejecutada | Tabla suppliers, supplier_id, columnas de unidades |
| migration-002 | ✅ Ejecutada | Soporte 3D (shelf_depth, depth) |
| migration-003 | ⚠️ Obsoleta | Redundante con migration-002 |
| migration-004 | ✅ Ejecutada | shelf_suppliers, shelf_type, ubicación bulk |
| migration-005 | ✅ Ejecutada | Corrección de total_capacity 3D |

**Datos actuales en BD**:
- 9 muestras globales con diferentes clases de peligro SGA
- 7 proveedores configurados
- 14 anaqueles con capacidad 3D (1000 celdas cada uno)
- 16 relaciones shelf_suppliers

---

## Próximos Pasos

1. Cambiar a modo Code para implementar las correcciones
2. Implementar correcciones en orden de prioridad
3. Probar cada corrección individualmente
4. Verificar que el sistema funcione correctamente

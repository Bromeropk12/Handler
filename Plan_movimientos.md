# Plan de Implementación: Movimiento 3D de Muestras con Drag-en-Grupo y SGA

**Versión:** 2.1 (ajustada con auditoría masiva de riesgos)
**Fecha de inicio:** pendiente
**Duración estimada:** 5 días laborables (1 semana)
**Stack objetivo:** React 18 + R3F 8 + Three.js 0.164 + Express + PostgreSQL

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Decisiones de diseño cerradas](#2-decisiones-de-diseño-cerradas)
3. [Arquitectura de alto nivel](#3-arquitectura-de-alto-nivel)
4. [Módulo A — Backend](#4-módulo-a--backend)
5. [Módulo B — Hooks de estado](#5-módulo-b--hooks-de-estado)
6. [Módulo C — Componentes 3D](#6-módulo-c--componentes-3d)
7. [Módulo D — UI de movimiento grupal](#7-módulo-d--ui-de-movimiento-grupal)
8. [Módulo E — Mini-mapa 3D](#8-módulo-e--mini-mapa-3d)
9. [Módulo F — Accesibilidad y edge cases](#9-módulo-f--accesibilidad-y-edge-cases)
10. [Módulo G — Tests y verificación](#10-módulo-g--tests-y-verificación)
11. [Módulo H — Polish y release](#11-módulo-h--polish-y-release)
12. [Matriz de riesgos y fixes](#12-matriz-de-riesgos-y-fixes)
13. [Checklist de definición de hecho (DoD)](#13-checklist-de-definición-de-hecho-dod)
14. [Orden estricto de ejecución](#14-orden-estricto-de-ejecución)

---

## 1. Resumen ejecutivo

Re-implementación completa del flujo de movimiento de muestras hijas (`dispensed_samples`) en el módulo Almacén con las siguientes características:

- **Drag-and-drop nativo en R3F/Three.js** para arrastrar **grupos** de muestras como una unidad rígida.
- **Restricción de tipo**: solo se pueden agrupar muestras del mismo `global_sample_id` (mismo producto, mismo lote, mismo SGA class).
- **Validación SGA en tiempo real**: cada celda destino se pre-valida contra el motor de compatibilidad química antes de permitir el drop, con feedback **bloqueante** (rojo pulsante, cursor `not-allowed`, shake, tooltip).
- **Mini-mapa 3D** lateral para selección de nivel destino (cross-level dentro del mismo anaquel).
- **Commit atómico transaccional**: el grupo se mueve completo o nada.
- **Modal de type-mismatch**: si el usuario intenta mezclar tipos, aparece confirmación (Reemplazar / Cancelar).
- **El flujo de single-move (1 muestra) sigue funcionando sin cambios**.

---

## 2. Decisiones de diseño cerradas

| # | Decisión | Elección |
|---|----------|----------|
| 1 | Forma del grupo | Traslación rígida (posiciones relativas preservadas) |
| 2 | Drag library | `@use-gesture/react` (~10 KB gz) |
| 3 | Preview SGA | Endpoint nuevo + cache local (1 request, lookup O(1)) |
| 4 | Commit atómico | Sí, transacción PostgreSQL (BEGIN/COMMIT/ROLLBACK) |
| 5 | Cross-shelf | Re-uso del `TargetShelfPicker` modal existente |
| 6 | Mismatch de tipo | Modal de confirmación (Reemplazar / Cancelar) |
| 7 | Restricción de tipo | Solo aplica en drag-en-grupo (count > 1) |
| 8 | SGA feedback | Bloqueante (no permite drop en inválido) |
| 9 | Límite de grupo | 10 muestras máximo |
| 10 | Mini-mapa | Panel lateral 220×300 px en modo grupo |
| 11 | Animación | `lerp` + `useFrame` (sin `react-spring`) |
| 12 | SGA rings en cubos | Anillo inferior coloreado por `ghs_danger_class` |
| 13 | Multi-shelf group | No permitido (cae a single-move flow) |
| 14 | Mismatched dimensions | No permitido (modal de dimensión mismatch) |
| 15 | Sample no-stored | No se puede seleccionar |
| 16 | Audit log | INSERT dentro de la transacción |
| 17 | Requests stale | `AbortController` para cancelar |
| 18 | Mobile | Mini-mapa colapsable en <1280px |
| 19 | Accesibilidad | Respetar `prefers-reduced-motion` + alternativa keyboard |
| 20 | Cambiar shelf mid-drag | Cancela el drag activo |

---

## 3. Arquitectura de alto nivel

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + R3F)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ShelfMap3D.jsx (orquestador)                                           │
│    ├─ useSampleSelection    (con validación de tipo/status/dim)          │
│    ├─ useGroupDrag          (estado de drag, ESC, visibilitychange)      │
│    ├─ useGroupPreview       (cache de preview + AbortController)        │
│    │                                                                   │
│    ├─ TypeMismatchModal     (Reemplazar / Cancelar)                     │
│    ├─ GroupToolbar          (info producto + Mover Grupo)               │
│    ├─ GroupConfirmModal     (tabla origen→destino)                      │
│    │                                                                   │
│    ├─ LevelDetailMap                                              │
│    │   ├─ SampleCube (con drag + SGA ring)                              │
│    │   ├─ EmptyCellTarget (states: valid/invalid/unknown)               │
│    │   └─ GroupDragGhost (N cubos fantasma)                             │
│    │                                                                   │
│    └─ ShelfMiniMap3D (3D completo del anaquel)                          │
│        └─ MiniSampleCube                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/JSON
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express + PostgreSQL)                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POST /api/warehouse/:id/preview-move-group                            │
│    └─ group-operations.js::previewGroupPlacement()                      │
│        ├─ validateGroupType()                                          │
│        ├─ getNeighborsByAABB()                                          │
│        └─ areCompatible() (sga-compatibility.js)                       │
│                                                                          │
│  POST /api/warehouse/:id/move-group                                     │
│    └─ group-operations.js::commitGroupMove() [TRANSACTION]             │
│        ├─ BEGIN                                                       │
│        ├─ validatePlacement() × N                                       │
│        ├─ UPDATE dispensed_samples × N                                  │
│        ├─ INSERT movements (sga_validated: true, batch_id) × N         │
│        └─ COMMIT / ROLLBACK                                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Módulo A — Backend

### A.1 — Dependencias

**Cambios:** ninguno (se usan librerías ya presentes).

### A.2 — Archivos nuevos

#### A.2.1 — `backend/src/modules/warehouse/group-operations.js`

**Propósito:** Lógica de previsualización y commit de grupos de muestras.

**Funciones exportadas:**

```js
// Previsualización: retorna matriz de celdas válidas/inválidas
async function previewGroupPlacement({ shelfId, sampleIds, targetShelfId, db })

// Commit atómico: mueve N muestras en una sola transacción
async function commitGroupMove({ sourceShelfId, targetShelfId, sampleMoves, userId, db })

// Validación de tipo: defense in depth
async function validateGroupType(sampleIds, db) // throws AppError si tipos distintos
```

**Estructura interna:**

```
group-operations.js
├── imports
├── previewGroupPlacement()           [~150 líneas]
│   ├── 1. validateGroupType()
│   ├── 2. SELECT samples del grupo + JOIN global_samples
│   ├── 3. SELECT muestras externas del target shelf
│   ├── 4. Calcular bounding box del grupo
│   ├── 5. Para cada (x,y,z) del target:
│   │     ├── Verificar límites del shelf
│   │     ├── Verificar AABB collision con externas
│   │     ├── Verificar SGA con externas
│   │     └── Si todo OK, marcar como compatible
│   └── 6. Retornar { cells[], valid_count, invalid_count, ... }
│
├── commitGroupMove()                 [~120 líneas]
│   ├── 1. BEGIN TRANSACTION
│   ├── 2. Para cada move:
│   │     ├── SELECT FOR UPDATE
│   │     ├── validatePlacement()
│   │     └── UPDATE dispensed_samples
│   ├── 3. INSERT movements (dentro de la tx)
│   ├── 4. COMMIT
│   └── 5. ROLLBACK en cualquier error
│
└── validateGroupType()               [~25 líneas]
    ├── SELECT DISTINCT global_sample_id WHERE id IN (...)
    └── throw AppError si count > 1
```

#### A.2.2 — `backend/tests/group-move-preview.test.js`

**Tests a incluir:**

```js
describe('previewGroupPlacement', () => {
  test('grupo de 2 muestras en anaquel vacío retorna 100% válido', ...)
  test('grupo de 1x1x1 retorna matriz grid_width × grid_height × shelf_depth', ...)
  test('grupo de 2x2x1 solo retorna celdas donde cabe el bloque', ...)
  test('grupo con Tóxico cerca de Comburente marca celda como conflictiva', ...)
  test('grupo de tipos distintos retorna 400 con lista de IDs', ...)
  test('target_shelf en otra market_line retorna 400', ...)
  test('shelf con 0 celdas válidas retorna valid_count: 0', ...)
  test('colisión interna del grupo se detecta y marca como invalid', ...)
});
```

#### A.2.3 — `backend/tests/group-move-commit.test.js`

**Tests a incluir:**

```js
describe('commitGroupMove', () => {
  test('commit exitoso: 3 muestras se mueven + log insertado con mismo batch_id', ...)
  test('commit falla en el move 2 de 3: ROLLBACK total, ningún UPDATE aplicado', ...)
  test('commit con status cambiado por otro user: retorna 409 con detalles', ...)
  test('commit con sample ya no en shelf origen: retorna 404', ...)
  test('movements log se inserta DENTRO de la transacción (atomic)', ...)
  test('commit concurrente: segundo user recibe 404 por shelf_id mismatch', ...)
});
```

### A.3 — Archivos modificados

#### A.3.1 — `backend/src/modules/warehouse/validations.js`

**Cambio:** extraer la lógica de "vecinos AABB" en una función reutilizable.

```diff
+ // Nueva función exportada
+ function getNeighborsByAABB(target, allSamples, radius = 3) {
+   // Lógica movida desde getNeighbors (línea 93-108)
+   // Acepta target con width/height/depth arbitrarios
+ }

  function getNeighbors(target, allSamples) {
-   // ... implementación actual ...
+   return getNeighborsByAABB(target, allSamples, 3);
  }
```

**Razón:** DRY entre `validatePlacement` y `previewGroupPlacement`.

#### A.3.2 — `backend/src/modules/warehouse/routes.js`

**Cambio:** añadir 2 endpoints.

```js
// Línea 254 (después de move-sample), añadir:

router.post(
  '/:id/preview-move-group',
  authenticate,
  requirePermission('warehouse.view'),
  warehouseController.previewGroupMove
);

router.post(
  '/:id/move-group',
  authenticate,
  requirePermission('warehouse.move_sample'),
  warehouseController.moveGroup
);
```

#### A.3.3 — `backend/src/modules/warehouse/controller.js`

**Cambio:** añadir 2 handlers que delegan a `group-operations.js`.

```js
exports.previewGroupMove = async (req, res, next) => {
  try {
    const { sample_ids, target_shelf_id } = req.body;
    const result = await groupOps.previewGroupPlacement({
      shelfId: req.params.id,
      sampleIds: sample_ids,
      targetShelfId: target_shelf_id || req.params.id,
      db: req.db,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.moveGroup = async (req, res, next) => {
  try {
    const { target_shelf_id, moves } = req.body;
    const result = await groupOps.commitGroupMove({
      sourceShelfId: req.params.id,
      targetShelfId: target_shelf_id || req.params.id,
      sampleMoves: moves,
      userId: req.user.id,
      db: req.db,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
```

### A.4 — Criterios de aceptación del módulo

- [ ] `pnpm test` pasa con 13+ tests nuevos (8 preview + 5 commit).
- [ ] `curl POST /preview-move-group` retorna matriz de celdas en <200ms para anaquel 10×10×10.
- [ ] `curl POST /move-group` con tipos distintos retorna 400.
- [ ] `curl POST /move-group` con move inválido en posición 2 de 3 retorna 400 y la query `SELECT` muestra que ningún UPDATE se aplicó.
- [ ] El log de movimientos tiene `batch_id` UUID compartido por todas las entries de un commit grupal.

---

## 5. Módulo B — Hooks de estado

### B.1 — Archivos nuevos

#### B.1.1 — `frontend/src/modules/warehouse/hooks/useGroupDrag.js` (~180 líneas)

**Propósito:** Orquestar el estado de drag-en-grupo.

**Estado interno:**

```js
const [dragState, setDragState] = useState({
  isDragging: false,
  anchorSampleId: null,
  currentOffset: { dx: 0, dy: 0, dz: 0 },
  hoveredCell: null,        // { x, y, z } | null
  hoveredValidity: null,    // 'valid' | 'invalid' | null
  hoveredConflicts: [],
});
```

**API exportada:**

```js
{
  dragState,
  onDragStart(sample),       // pointer down sobre el anchor
  onDrag(offset),            // pointer move (offset en world units)
  onDragEnd(offset),         // pointer up
  cancelDrag(),              // ESC o cambio de shelf
  resetState(),              // post-commit
}
```

**Listeners globales:**

```js
useEffect(() => {
  const onKey = (e) => { if (e.key === 'Escape' && dragState.isDragging) cancelDrag(); };
  const onVisibility = () => { if (document.hidden && dragState.isDragging) cancelDrag(); };
  const onResize = () => { if (dragState.isDragging) cancelDrag(); };
  const onMotion = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(reduced);
  };
  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', onMotion);
  return () => { /* cleanup */ };
}, [dragState.isDragging]);
```

**Lógica de `onDragEnd`:**

```js
const onDragEnd = useCallback((offset) => {
  if (!dragState.hoveredCell) {
    // Drop fuera del canvas → cancel
    triggerShake();
    resetState();
    return;
  }
  if (dragState.hoveredValidity === 'invalid') {
    // Drop inválido → shake + return
    triggerShake();
    resetState();
    return;
  }
  if (dragState.hoveredValidity === 'valid') {
    // Drop válido → abrir confirm modal
    onDropValid(dragState.hoveredCell);
    resetState();
    return;
  }
}, [dragState, onDropValid]);
```

#### B.1.2 — `frontend/src/modules/warehouse/hooks/useGroupPreview.js` (~100 líneas)

**Propósito:** Cache local del preview del backend.

**Estado interno:**

```js
const [cache, setCache] = useState({
  cells: [],            // [{ x, y, z, compatible, conflicts[] }, ...]
  groupShape: null,     // { width, height, depth }
  shelf: null,          // { id, grid_width, ... }
  allSameType: false,
  requestId: 0,         // para evitar race conditions
});
const [loading, setLoading] = useState(false);
const abortRef = useRef(null);
```

**API exportada:**

```js
{
  cache,
  loading,
  loadPreview(sourceShelfId, sampleIds, targetShelfId),  // AbortController + requestId
  getCellValidity(x, y, z),  // O(1) lookup
  clearCache(),              // al cambiar de shelf o cancelar
}
```

**Lógica anti-race:**

```js
const loadPreview = useCallback(async (sourceShelfId, sampleIds, targetShelfId) => {
  // Cancelar request anterior
  if (abortRef.current) abortRef.current.abort();

  const controller = new AbortController();
  abortRef.current = controller;
  const myRequestId = cache.requestId + 1;

  setLoading(true);
  try {
    const res = await warehouseAPI.previewGroupMove(sourceShelfId, {
      sample_ids: sampleIds, target_shelf_id: targetShelfId,
    }, { signal: controller.signal });

    // Solo aplicar si es la request más reciente
    if (myRequestId > cache.requestId) {
      setCache({ ...res.data.data, requestId: myRequestId });
    }
  } catch (err) {
    if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
      // Error real, no cancelación
      toast.error('Error al previsualizar el movimiento');
    }
  } finally {
    if (myRequestId === cache.requestId + 1) setLoading(false);
  }
}, [cache.requestId]);
```

#### B.1.3 — `frontend/src/modules/warehouse/hooks/useShelfStaleness.js` (~60 líneas)

**Propósito:** Detectar cuando el cache se vuelve stale (otro user movió muestras).

```js
export const useShelfStaleness = (shelfId, mapData) => {
  const [isStale, setIsStale] = useState(false);
  const lastUpdatedRef = useRef(mapData?.lastUpdated);

  useEffect(() => {
    // Polling cada 30s (o SSE si está disponible)
    const interval = setInterval(async () => {
      try {
        const res = await warehouseAPI.getShelfMap(shelfId);
        if (res.data.data.lastUpdated !== lastUpdatedRef.current) {
          setIsStale(true);
        }
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [shelfId]);

  return { isStale, ackRefresh: () => setIsStale(false) };
};
```

### B.2 — Archivos modificados

#### B.2.1 — `frontend/src/modules/warehouse/hooks/useSampleSelection.js`

**Cambios:** añadir validación de tipo, status, dimensiones y límite de 10.

```js
export const useSampleSelection = () => {
  const [selectedSamples, setSelectedSamples] = useState(new Map());
  const [selectionType, setSelectionType] = useState(null);
  const [rejectionEvent, setRejectionEvent] = useState(null);

  const toggleSample = useCallback((sample, options = {}) => {
    const { onTypeMismatch, onDimensionMismatch, onStatusMismatch, onLimitReached } = options;

    setSelectedSamples(prev => {
      const currentCount = prev.size;

      // Si la selección está vacía, agregar libremente (validar que sea 'stored' y dims 1x1x1)
      if (currentCount === 0) {
        if (sample.status && sample.status !== 'stored') {
          setRejectionEvent({ type: 'status', sample });
          return prev;
        }
        setSelectionType({
          id: sample.global_sample_id,
          name: sample.global_sample_name || sample.name,
          dangerClass: sample.ghs_danger_class,
          dimensions: `${sample.width || 1}x${sample.height || 1}x${sample.depth || 1}`,
        });
        return new Map([[sample.id, sample]]);
      }

      // Si la muestra ya está, deseleccionar
      if (prev.has(sample.id)) {
        const newMap = new Map(prev);
        newMap.delete(sample.id);
        if (newMap.size === 0) setSelectionType(null);
        return newMap;
      }

      // Límite de 10
      if (currentCount >= 10) {
        setRejectionEvent({ type: 'limit', currentCount });
        return prev;
      }

      // Validar tipo
      if (sample.global_sample_id !== selectionType?.id) {
        setRejectionEvent({ type: 'type', currentType: selectionType, newSample: sample });
        return prev;
      }

      // Validar dimensiones
      const sampleDims = `${sample.width || 1}x${sample.height || 1}x${sample.depth || 1}`;
      if (sampleDims !== selectionType?.dimensions) {
        setRejectionEvent({ type: 'dimension', currentDims: selectionType.dimensions, newDims: sampleDims });
        return prev;
      }

      // Validar status
      if (sample.status && sample.status !== 'stored') {
        setRejectionEvent({ type: 'status', sample });
        return prev;
      }

      // Todo OK: agregar
      const newMap = new Map(prev);
      newMap.set(sample.id, sample);
      return newMap;
    });
  }, [selectionType]);

  // ... clearSelection, isSelected, selectedList (sin cambios)

  return {
    selectedSamples: Array.from(selectedSamples.values()),
    count: selectedSamples.size,
    selectionType,
    rejectionEvent,           // { type, ... } | null
    clearRejection: () => setRejectionEvent(null),
    toggleSample,
    selectAll,
    clearSelection,
    isSelected,
  };
};
```

### B.3 — Criterios de aceptación del módulo

- [ ] `useGroupDrag` maneja correctamente ESC, visibilitychange, resize.
- [ ] `useGroupPreview` cancela requests stale con AbortController.
- [ ] `useSampleSelection` rechaza selecciones con tipos, statuses o dimensiones distintas.
- [ ] `useSampleSelection` limita a 10 muestras.
- [ ] `useShelfStaleness` detecta cambios del backend.

---

## 6. Módulo C — Componentes 3D

### C.1 — Archivos modificados

#### C.1.1 — `frontend/src/modules/warehouse/components/3d/Shared3DComponents.jsx`

**Cambios en `SampleCube`:**

- Añadir SGA ring inferior.
- Añadir `isSourceOfMove`, `onDragStart`, `onDrag`, `onDragEnd` props.
- Integrar `useDrag` de `@use-gesture/react`.
- Modificar `useFrame` para aplicar `dragOffset`.
- No bindar `onClick` cuando `isSourceOfMove === true` (evitar doble trigger).

**Código clave:**

```jsx
import { useDrag } from '@use-gesture/react';

const SGA_COLORS = {
  'Sin Riesgo': '#22C55E',
  'Inflamable': '#F97316',
  'Corrosivo':  '#EAB308',
  'Toxico':     '#EF4444',
  'Comburente': '#3B82F6',
  'Explosivo':  '#A855F7',
};

export const SampleCube = ({
  cell, x, y, z, offsetX, offsetY = 0, offsetZ,
  isSelected, isDimmed, isSourceOfMove, isDragging,
  onHover, onClick, onDragStart, onDrag, onDragEnd,
  status, isMultiSelected,
}) => {
  const cubeGroupRef = useRef();
  const meshRef = useRef();
  const ringRef = useRef();
  const dragOffsetRef = useRef({ x: 0, z: 0 });
  const [hovered, setHovered] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const bindDrag = useDrag(({ active, movement: [mx, mz], first, last, event }) => {
    if (first) {
      event.stopPropagation();
      dragOffsetRef.current = { x: 0, z: 0 };
      onDragStart?.(cell);
    }
    if (active) {
      // Convertir pixeles a world units
      dragOffsetRef.current = { x: mx * 0.01, z: mz * 0.01 };
      onDrag?.(dragOffsetRef.current);
    }
    if (last) {
      onDragEnd?.(dragOffsetRef.current);
      dragOffsetRef.current = { x: 0, z: 0 };
    }
  }, {
    threshold: 4,
    filterTaps: true,
    eventOptions: { pointer: { capture: true } },
  });

  useFrame((state) => {
    if (!cubeGroupRef.current) return;

    // 1. Drag offset
    const targetX = isDragging ? dragOffsetRef.current.x : 0;
    const targetZ = isDragging ? dragOffsetRef.current.z : 0;
    cubeGroupRef.current.position.x = THREE.MathUtils.lerp(
      cubeGroupRef.current.position.x, targetX, 0.25);
    cubeGroupRef.current.position.z = THREE.MathUtils.lerp(
      cubeGroupRef.current.position.z, targetZ, 0.25);

    // 2. Float Y position (animación existente)
    const floatY = isActiveSelection
      ? baseY + 0.25 + Math.sin(state.clock.elapsedTime * 2.5) * 0.07
      : hovered && !isDimmed ? baseY + 0.15 : baseY + 0.05;
    cubeGroupRef.current.position.y = THREE.MathUtils.lerp(
      cubeGroupRef.current.position.y, floatY, 0.12);

    // 3. Material tweens (existente)
    if (meshRef.current) {
      meshRef.current.material.opacity = THREE.MathUtils.lerp(
        meshRef.current.material.opacity, isDimmed ? 0.06 : 0.95, 0.1);
      meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        meshRef.current.material.emissiveIntensity,
        isActiveSelection ? 0.55 : hovered ? 0.25 : 0.05, 0.1);
    }

    // 4. Floor glow ring (existente)
    if (ringRef.current) {
      ringRef.current.material.opacity = THREE.MathUtils.lerp(
        ringRef.current.material.opacity,
        (isActiveSelection || hovered) && !isDimmed ? 0.6 : 0, 0.12);
    }

    // 5. Shake animation (si drop inválido)
    if (isShaking) {
      cubeGroupRef.current.position.x = Math.sin(state.clock.elapsedTime * 60) * 0.1;
    }
  });

  // Geometry
  const w = cell.width || 1;
  const d = cell.depth || cell.height || 1;
  const px = offsetX + x + w / 2;
  const pz = offsetZ + z + d / 2;
  const baseY = y * LEVEL_HEIGHT + offsetY;
  const color = isActiveSelection ? '#facc15' : getColorByName(cell.name || cell.global_sample_name);
  const sgaColor = SGA_COLORS[cell.ghs_danger_class] || '#475569';

  return (
    <group
      position={[px, 0, pz]}
      {...(isSourceOfMove ? bindDrag() : {
        onPointerOver: (e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; if (onHover) onHover(cell); },
        onPointerOut:  ()  => { setHovered(false); document.body.style.cursor = 'default'; if (onHover) onHover(null); },
        onClick:       (e) => { e.stopPropagation(); if (onClick) onClick(); },
      })}
    >
      {/* SGA ring inferior (NUEVO) */}
      <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(w, d) * 0.45, Math.max(w, d) * 0.55, 32]} />
        <meshBasicMaterial color={sgaColor} transparent opacity={0.7} depthWrite={false} />
      </mesh>

      <group ref={cubeGroupRef} position={[0, baseY + 0.05, 0]}>
        {/* Cubo principal (existente) */}
        <mesh ref={meshRef}>
          <boxGeometry args={[w - 0.1, 0.8, d - 0.1]} />
          <meshStandardMaterial
            color={color}
            roughness={0.25}
            metalness={0.55}
            emissive={color}
            emissiveIntensity={0.05}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Stamp (existente) */}
        {!isDimmed && (
          <mesh position={[0, 0.425, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.46, 0.46]} />
            <meshStandardMaterial map={stampTexture} transparent roughness={0.25} metalness={0.45} />
          </mesh>
        )}
      </group>

      {/* Source-of-move arrow (existente) */}
      {isSourceOfMove && (
        <mesh position={[0, baseY + 1.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Tooltip (existente) */}
      {isActiveSelection && (
        <Html ... />
      )}
    </group>
  );
};
```

**Cambios en `EmptyCellTarget`:**

- Añadir props `validity` ('valid' | 'invalid' | 'unknown') y `reason` (string).
- Cambiar colores y animaciones según validity.
- Cursor: `grab` para valid, `not-allowed` para invalid, `default` para unknown.

```jsx
export const EmptyCellTarget = ({
  x, y = 0, z, offsetX, offsetY = 0, offsetZ,
  width = 1, depth = 1, onDrop, validity = 'unknown', reason = '',
}) => {
  const [hovered, setHovered] = useState(false);
  const px = offsetX + x + width / 2;
  const pz = offsetZ + z + depth / 2;
  const baseY = y * LEVEL_HEIGHT + offsetY;

  const colorMap = {
    valid:   { bg: '#10b981', emissive: 0.6, opacity: 0.4 },
    invalid: { bg: '#ef4444', emissive: 0.8, opacity: 0.5 },
    unknown: { bg: '#475569', emissive: 0.2, opacity: 0.1 },
  };
  const cursorMap = { valid: 'grab', invalid: 'not-allowed', unknown: 'default' };
  const cfg = colorMap[validity];

  return (
    <group
      position={[px, baseY + 0.4, pz]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = cursorMap[validity];
        if (reason && validity === 'invalid') {
          // Mostrar tooltip con razón
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (validity !== 'invalid' && onDrop) onDrop({ x, y, z });
      }}
    >
      <mesh>
        <boxGeometry args={[width - 0.1, 0.8, depth - 0.1]} />
        <meshStandardMaterial
          color={cfg.bg}
          transparent
          opacity={hovered ? cfg.opacity : cfg.opacity * 0.3}
          emissive={cfg.bg}
          emissiveIntensity={hovered ? cfg.emissive : 0.1}
          roughness={0.2}
        />
      </mesh>

      {/* Invalid: pulse animation */}
      {validity === 'invalid' && (
        <mesh ref={pulseRef}>
          <boxGeometry args={[width - 0.05, 0.85, depth - 0.05]} />
          <meshBasicMaterial color={cfg.bg} wireframe transparent opacity={0.5} />
        </mesh>
      )}

      {hovered && validity === 'valid' && (
        <pointLight position={[0, 0.5, 0]} intensity={1} distance={2} color={cfg.bg} />
      )}
    </group>
  );
};
```

#### C.1.2 — `frontend/src/modules/warehouse/components/3d/LevelDetailMap.jsx`

**Cambios:**

- Añadir props: `groupDragState`, `onGroupDragStart`, `onGroupDrag`, `onGroupDragEnd`.
- En modo `group-movement`, renderizar `GroupDragGhost` en lugar de `EmptyCellTarget`.
- Pasa `isSourceOfMove={true}` a las muestras seleccionadas.
- Toggle `OrbitControls.enabled = !groupDragState.isDragging`.
- Calcular `validity` por celda usando `preview.getCellValidity(x, y, z)`.

```jsx
<OrbitControls
  makeDefault
  enabled={!groupDragState?.isDragging}
  ...
/>

{levelSamples.map(sample => {
  const isInGroup = mode === 'group-movement' && groupDragState.anchorSampleId &&
    groupSamples.some(s => s.id === sample.id);
  return (
    <SampleCube
      ...
      isSourceOfMove={isInGroup}
      isDragging={groupDragState.isDragging && groupDragState.anchorSampleId === sample.id}
      onDragStart={(cell) => onGroupDragStart(sample)}
      onDrag={(offset) => onGroupDrag(offset, sample)}
      onDragEnd={(offset) => onGroupDragEnd(offset, sample)}
    />
  );
})}

{mode === 'group-movement' && (
  emptyCells.map(cell => {
    const validity = preview.getCellValidity(cell.x, cell.y, cell.z);
    return (
      <GroupDragGhost
        key={`ghost-${cell.x}-${cell.z}`}
        anchorCell={cell}
        groupSamples={groupSamples}
        offset={groupDragState.currentOffset}
        validity={validity?.compatible ? 'valid' : 'invalid'}
        conflicts={validity?.conflicts || []}
        isDragging={groupDragState.isDragging}
      />
    );
  })
)}
```

### C.2 — Criterios de aceptación del módulo

- [ ] `SampleCube` se puede arrastrar con click-and-hold (>4px de movimiento).
- [ ] SGA ring visible en cada cubo, color correcto según `ghs_danger_class`.
- [ ] Drag NO dispara `onClick` accidentalmente.
- [ ] OrbitControls se deshabilita durante drag.
- [ ] `EmptyCellTarget` muestra color verde/rojo/gris según validity.
- [ ] `prefers-reduced-motion: reduce` desactiva shake y pulse.

---

## 7. Módulo D — UI de movimiento grupal

### D.1 — Archivos nuevos

#### D.1.1 — `frontend/src/modules/warehouse/components/group/GroupDragGhost.jsx` (~220 líneas)

**Propósito:** Renderizar N cubos fantasma que siguen al cursor durante el drag.

**Props:**

```js
{
  anchorCell,         // { x, y, z } de la muestra ancla
  groupSamples,       // Array de todas las muestras del grupo
  offset,             // { dx, dy, dz } en world units
  validity,           // 'valid' | 'invalid'
  conflicts,          // Array de conflictos SGA
  isDragging,         // boolean
}
```

**Lógica de render:**

```jsx
export const GroupDragGhost = ({ anchorCell, groupSamples, offset, validity, isDragging }) => {
  const groupRef = useRef();

  // Posición base de la ancla
  const anchorWorld = useMemo(() => gridToWorld(anchorCell, ...), [anchorCell]);

  // Posiciones relativas de las otras muestras
  const relativePositions = useMemo(() => {
    const positions = [];
    const anchorSample = groupSamples.find(s => s.id === anchorCell.sampleId);
    if (!anchorSample) return [];
    groupSamples.forEach(sample => {
      const dx = (sample.position_x - anchorSample.position_x) * 0.01;
      const dz = (sample.position_z - anchorSample.position_z) * 0.01;
      const dy = (sample.position_y - anchorSample.position_y) * LEVEL_HEIGHT;
      positions.push({ sample, dx, dy, dz });
    });
    return positions;
  }, [groupSamples, anchorCell]);

  const color = validity === 'valid' ? '#10b981' : '#ef4444';
  const emissiveIntensity = validity === 'valid' ? 0.6 :
    (isDragging ? Math.sin(Date.now() * 0.01) * 0.5 + 0.5 : 0.8);

  return (
    <group ref={groupRef} position={[anchorWorld.x + offset.dx, 0.5, anchorWorld.z + offset.dz]}>
      {relativePositions.map(({ sample, dx, dy, dz }) => {
        const w = sample.width || 1;
        const d = sample.depth || 1;
        return (
          <group key={sample.id} position={[dx, dy, dz]}>
            <mesh>
              <boxGeometry args={[w - 0.1, 0.8, d - 0.1]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={0.5}
                emissive={color}
                emissiveIntensity={emissiveIntensity}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
```

#### D.1.2 — `frontend/src/modules/warehouse/components/group/GroupToolbar.jsx` (~200 líneas)

**Propósito:** Toolbar específica del modo grupo (reemplaza a `SampleMovementToolbar` cuando count > 1).

**Estructura visual:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [SGA-RING]  3 × Acetone BASF (Lote 1234)         [X] [Mover Grupo] │
│              Inflamable • ID: uuid-...                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Código:**

```jsx
const GroupToolbar = ({
  selectionType,      // { id, name, dangerClass, dimensions }
  count,              // número de muestras seleccionadas
  onMove,             // callback para "Mover Grupo"
  onClear,            // callback para limpiar selección
  canMove,            // boolean: ¿el usuario tiene permiso warehouse.move_sample?
  sameShelf,          // boolean: ¿todas las muestras están en el mismo shelf?
}) => {
  if (count === 0) return null;

  const exceedsLimit = count > 10;
  const isBlocked = exceedsLimit || !sameShelf || !canMove;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-surface-600/90 backdrop-blur-xl border border-primary-500/30 rounded-2xl p-3 shadow-[0_10px_40px_rgba(14,165,233,0.3)] flex items-center gap-4">
        {/* SGA ring + product info */}
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `${SGA_COLORS[selectionType.dangerClass]}20`,
              border: `2px solid ${SGA_COLORS[selectionType.dangerClass]}`,
            }}
          >
            <span className="text-white font-black text-sm">{count}</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">
              {count} × {selectionType.name}
            </p>
            <p className="text-gray-400 text-xs flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: SGA_COLORS[selectionType.dangerClass] }}
              />
              {selectionType.dangerClass} • Dims: {selectionType.dimensions}
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-700" />

        {/* Warnings */}
        {exceedsLimit && (
          <span className="text-danger-400 text-xs font-bold">
            ⚠️ Máximo 10 muestras
          </span>
        )}
        {!sameShelf && (
          <span className="text-warning-400 text-xs font-bold">
            ⚠️ Múltiples anaqueles — selecciona muestras del mismo anaquel
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Deseleccionar todo"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onMove}
            disabled={isBlocked}
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2 px-6 flex items-center gap-2 font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowsRightLeftIcon className="w-5 h-5" />
            Mover Grupo
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### D.1.3 — `frontend/src/modules/warehouse/components/group/GroupConfirmModal.jsx` (~240 líneas)

**Propósito:** Modal de confirmación con tabla origen→destino.

**Estructura:**

```jsx
<Modal
  isOpen={isOpen}
  onClose={isExecuting ? () => {} : onClose}
  title={`Confirmar Movimiento de ${count} Muestras`}
  maxWidth="max-w-4xl"
  footer={
    <>
      <button onClick={onClose} disabled={isExecuting}>Cancelar</button>
      <button onClick={onConfirm} disabled={isExecuting || !allValid}>
        {isExecuting ? <ArrowPathIcon className="animate-spin" /> : <CheckCircleIcon />}
        {isExecuting ? 'Moviendo...' : 'Confirmar y Mover'}
      </button>
    </>
  }
>
  <table>
    <thead>
      <tr>
        <th>Muestra</th>
        <th>SGA</th>
        <th>Origen</th>
        <th></th>
        <th>Destino</th>
      </tr>
    </thead>
    <tbody>
      {assignments.map(a => (
        <tr key={a.sampleData.id}>
          <td>{a.sampleData.name}</td>
          <td><SGABadge class={a.sampleData.ghs_danger_class} /></td>
          <td>({a.sampleData.position_x + 1}, {a.sampleData.position_y + 1}, {a.sampleData.position_z + 1})</td>
          <td><ArrowRightIcon /></td>
          <td>({a.x + 1}, {a.y + 1}, {a.z + 1})</td>
        </tr>
      ))}
    </tbody>
  </table>

  {errors.length > 0 && <ErrorPanel errors={errors} />}
</Modal>
```

#### D.1.4 — `frontend/src/modules/warehouse/components/selection/TypeMismatchModal.jsx` (~120 líneas)

**Propósito:** Modal de confirmación cuando el usuario intenta seleccionar una muestra de tipo distinto.

```jsx
<Modal isOpen={isOpen} onClose={onCancel} title="Tipo de muestra diferente">
  <div className="p-4 space-y-4">
    <p>
      Tu selección actual contiene
      <strong className="text-primary-400"> {currentType?.name} </strong>
      ({currentCount} {currentCount === 1 ? 'unidad' : 'unidades'}).
    </p>
    <p>
      Intentas agregar
      <strong className="text-amber-400"> {newSample?.global_sample_name || newSample?.name} </strong>,
      que es un producto diferente.
    </p>
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
      <p className="text-amber-300 text-sm">
        Solo puedes mover muestras del mismo tipo simultáneamente.
      </p>
    </div>
    <div className="flex justify-end gap-3">
      <button onClick={onCancel} className="px-4 py-2 text-gray-400">Cancelar</button>
      <button onClick={() => onReplace(newSample)} className="bg-primary-500 px-6 py-2 text-white rounded-xl">
        Reemplazar selección
      </button>
    </div>
  </div>
</Modal>
```

#### D.1.5 — `frontend/src/modules/warehouse/components/selection/DimensionMismatchModal.jsx` (~100 líneas)

Similar a `TypeMismatchModal` pero para dimensiones.

### D.2 — Archivos modificados

#### D.2.1 — `frontend/src/services/api.js`

**Cambio:** añadir 2 métodos al `warehouseAPI`.

```js
previewGroupMove: (sourceShelfId, body, config = {}) =>
  api.post(`/api/warehouse/${sourceShelfId}/preview-move-group`, body, config),

commitGroupMove: (sourceShelfId, body) =>
  api.post(`/api/warehouse/${sourceShelfId}/move-group`, body),
```

#### D.2.2 — `frontend/src/modules/warehouse/components/ShelfMap3D.jsx`

**Cambios mayores:**

- Importar nuevos hooks: `useGroupDrag`, `useGroupPreview`, `useShelfStaleness`.
- Importar nuevos componentes: `GroupDragGhost`, `GroupToolbar`, `GroupConfirmModal`, `TypeMismatchModal`, `DimensionMismatchModal`, `ShelfMiniMap3D`.
- State machine ampliada: `idle | single-moving | group-moving | confirming`.
- Render condicional de toolbar según `count`.
- Integración con `useSampleSelection.rejectionEvent`.
- Integración con `useGroupPreview.loadPreview()` al entrar en modo grupo.
- Pasada de props a `LevelDetailMap` para drag handlers.

**Pseudo-código de orquestación:**

```jsx
const ShelfMap3D = ({ selectedShelf, onBack }) => {
  const [mode, setMode] = useState('idle');
  const [confirmData, setConfirmData] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const selection = useSampleSelection();
  const preview = useGroupPreview();
  const staleness = useShelfStaleness(selectedShelf.id, mapData);

  // Calcular si todas las muestras están en el mismo shelf
  const allSameShelf = useMemo(() => {
    if (selection.selectedSamples.length === 0) return true;
    const first = selection.selectedSamples[0];
    return selection.selectedSamples.every(s => s.shelf_id === first.shelf_id);
  }, [selection.selectedSamples]);

  const groupDrag = useGroupDrag({
    groupSamples: selection.selectedSamples,
    sourceShelf: selectedShelf,
    onDropValid: (cell) => {
      // Construir assignments para cada muestra del grupo
      const assignments = selection.selectedSamples.map(s => ({
        sampleData: s,
        targetShelfId: selectedShelf.id,
        x: s.position_x + (cell.x - groupDrag.anchorCell.x),
        y: s.position_y + (cell.y - groupDrag.anchorCell.y),
        z: (s.position_z || 0) + (cell.z - groupDrag.anchorCell.z),
      }));
      setConfirmData(assignments);
      setMode('confirming');
    },
    onDropInvalid: () => {
      // Trigger shake animation
      groupDrag.triggerShake();
    },
    onChangeShelf: () => {
      // Cancela el drag si está activo
      groupDrag.cancelDrag();
    },
  });

  // Al entrar en modo grupo, cargar preview
  useEffect(() => {
    if (mode === 'group-moving' && selection.selectedSamples.length > 0) {
      preview.loadPreview(selectedShelf.id, selection.selectedSamples.map(s => s.id));
    }
  }, [mode, selection.selectedSamples]);

  const handleConfirm = async () => {
    setIsExecuting(true);
    try {
      const moves = confirmData.map(a => ({
        sample_id: a.sampleData.id,
        new_position_x: a.x,
        new_position_y: a.y,
        new_position_z: a.z,
      }));
      await warehouseAPI.commitGroupMove(selectedShelf.id, {
        target_shelf_id: confirmData[0].targetShelfId,
        moves,
      });
      toast.success(`${moves.length} muestras movidas exitosamente`);
      selection.clearSelection();
      setMode('idle');
      fetchMapData();
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div>
      {/* Header, body, modales... */}

      {/* Toolbar: single o group */}
      {selection.count > 0 && mode === 'idle' && (
        selection.count === 1 ? (
          <SampleMovementToolbar ... />
        ) : (
          <GroupToolbar
            selectionType={selection.selectionType}
            count={selection.count}
            onMove={() => setMode('group-moving')}
            onClear={selection.clearSelection}
            canMove={userHasPermission('warehouse.move_sample')}
            sameShelf={allSameShelf}
          />
        )
      )}

      <LevelDetailMap
        ...
        mode={mode}
        groupDragState={groupDrag.dragState}
        groupSamples={selection.selectedSamples}
        preview={preview}
        onGroupDragStart={groupDrag.onDragStart}
        onGroupDrag={groupDrag.onDrag}
        onGroupDragEnd={groupDrag.onDragEnd}
      />

      {/* Staleness warning */}
      {staleness.isStale && (
        <div className="fixed top-20 right-6 z-50 bg-amber-500/20 border border-amber-500 rounded-xl p-3">
          <p>Los datos pueden estar desactualizados. <button onClick={() => { fetchMapData(); staleness.ackRefresh(); }}>Recargar</button></p>
        </div>
      )}

      {/* Mini-mapa solo en modo grupo */}
      {mode === 'group-moving' && (
        <ShelfMiniMap3D
          shelf={selectedShelf}
          samples={mapData.samples}
          previewCache={preview.cache}
          groupDragState={groupDrag.dragState}
        />
      )}

      {/* Confirm modal */}
      {mode === 'confirming' && confirmData && (
        <GroupConfirmModal
          isOpen={true}
          onClose={() => { setMode('group-moving'); }}
          onConfirm={handleConfirm}
          assignments={confirmData}
          isExecuting={isExecuting}
        />
      )}

      {/* Type mismatch modal */}
      {selection.rejectionEvent?.type === 'type' && (
        <TypeMismatchModal
          isOpen={true}
          currentType={selection.rejectionEvent.currentType}
          currentCount={selection.count}
          newSample={selection.rejectionEvent.newSample}
          onCancel={selection.clearRejection}
          onReplace={(s) => {
            selection.clearSelection();
            selection.toggleSample(s);
            selection.clearRejection();
          }}
        />
      )}

      {/* Dimension mismatch modal */}
      {selection.rejectionEvent?.type === 'dimension' && (
        <DimensionMismatchModal ... />
      )}
    </div>
  );
};
```

### D.3 — Criterios de aceptación del módulo

- [ ] Toolbar cambia entre single y group según `count`.
- [ ] TypeMismatchModal aparece al intentar mezclar tipos.
- [ ] DimensionMismatchModal aparece al intentar mezclar dims.
- [ ] Limit warning aparece al pasar de 10.
- [ ] GroupConfirmModal muestra tabla con N filas, disable durante `isExecuting`.
- [ ] Breadcrumb de éxito tras commit grupal.

---

## 8. Módulo E — Mini-mapa 3D

### E.1 — Archivos nuevos

#### E.1.1 — `frontend/src/modules/warehouse/components/minimap/ShelfMiniMap3D.jsx` (~300 líneas)

**Propósito:** Vista 3D compacta del anaquel completo con cursor 3D que sigue al cursor del usuario.

**Props:**

```js
{
  shelf,             // { id, grid_width, grid_height, shelf_depth, name }
  samples,           // Array de todas las muestras del anaquel
  previewCache,      // { cells[], ... } del useGroupPreview
  groupDragState,    // { isDragging, currentOffset, ... }
}
```

**Estructura:**

```jsx
<div className="fixed right-6 top-24 w-[220px] h-[300px] z-30 bg-surface-600/90 backdrop-blur-xl rounded-2xl border border-white/10">
  <div className="p-3">
    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mini-mapa</h4>
    <p className="text-[9px] text-gray-400">Arrastra aquí para cross-level</p>
  </div>

  <Canvas
    camera={{ fov: 30, position: [0, totalLevels, 1] }}
    gl={{ alpha: true, antialias: true }}
    style={{ width: '100%', height: '240px' }}
  >
    <CameraController view="top" />
    <ambientLight intensity={0.5} />
    <directionalLight position={[5, 10, 5]} intensity={0.8} />

    <ShelfStructure totalCols={totalCols} totalDepth={totalDepth} totalLevels={totalLevels} />

    {/* Mini cubos para todas las muestras */}
    {samples.map(sample => <MiniSampleCube key={sample.id} sample={sample} />)}

    {/* Cursor 3D que sigue al drag */}
    {groupDragState.isDragging && (
      <DragCursor
        offset={groupDragState.currentOffset}
        groupShape={previewCache.groupShape}
      />
    )}

    {/* Overlay de validez por celda */}
    {previewCache.cells?.map(cell => (
      cell.compatible && (
        <mesh key={`v-${cell.x}-${cell.y}-${cell.z}`} position={[cell.x, cell.y * LEVEL_HEIGHT, cell.z]}>
          <boxGeometry args={[0.8, 0.05, 0.8]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
        </mesh>
      )
    ))}
  </Canvas>
</div>
```

**Responsive:**

```jsx
// Ocultar en pantallas <1280px
useEffect(() => {
  const checkSize = () => setIsVisible(window.innerWidth >= 1280);
  checkSize();
  window.addEventListener('resize', checkSize);
  return () => window.removeEventListener('resize', checkSize);
}, []);
```

**Click-to-drop en la miniatura:**

```jsx
<mesh
  onClick={(e) => {
    e.stopPropagation();
    if (onMinimapDrop) onMinimapDrop({ x: cellX, y: level, z: cellZ });
  }}
>
  ...
</mesh>
```

### E.2 — Criterios de aceptación del módulo

- [ ] Mini-mapa renderiza 220×300 px en la esquina superior derecha.
- [ ] Mini-mapa se oculta en pantallas <1280px con toggle.
- [ ] Click en una celda de la miniatura dispara drop en el mapa principal.
- [ ] Cursor 3D sigue al drag en tiempo real.

---

## 9. Módulo F — Accesibilidad y edge cases

### F.1 — Soporte `prefers-reduced-motion`

**Archivos afectados:** todos los que tengan animaciones.

```js
// Custom hook
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
};
```

**Aplicación:**

```jsx
const reducedMotion = usePrefersReducedMotion();

useFrame((state) => {
  if (reducedMotion) {
    // Sin lerp, sin shake, sin pulse
    cubeGroupRef.current.position.set(targetX, targetY, targetZ);
    return;
  }
  // ... animación normal
});
```

### F.2 — Alternativa keyboard

**Archivo:** `frontend/src/modules/warehouse/hooks/useKeyboardGroupNav.js` (~120 líneas)

**Propósito:** Permitir mover muestras sin drag, usando solo teclado.

**Atajos:**

| Tecla | Acción |
|---|---|
| `Espacio` sobre cubo | Seleccionar / deseleccionar |
| `Tab` | Moverse entre cubos |
| `M` | Entrar en modo "Mover Grupo" |
| `Esc` | Cancelar |
| `Enter` | Confirmar drop |
| `↑/↓/←/→` | Mover cursor de destino (1 celda) |
| `Shift+↑/↓/←/→` | Mover cursor de destino (5 celdas) |
| `C` | Cambiar anaquel destino (abre picker) |

**Implementación:**

```js
export const useKeyboardGroupNav = ({ onMove, onDrop, onCancel, ... }) => {
  useEffect(() => {
    const handler = (e) => {
      // ... lógica de atajos
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [...]);
};
```

### F.3 — Edge cases raros

| Caso | Manejo |
|---|---|
| Tab en background | `useGroupDrag` cancela en `visibilitychange` |
| Window resize | `useGroupDrag` cancela si `isDragging` |
| Cambiar shelf mid-drag | `useGroupDrag.cancelDrag()` + reset preview |
| Doble-click en confirmar | Disable button durante `isExecuting` |
| Network timeout | `axios` timeout 10s para preview, 30s para commit |
| 401 en preview o commit | Interceptor redirige a login |
| Stale data | `useShelfStaleness` + toast + botón recargar |

### F.4 — Criterios de aceptación del módulo

- [ ] `prefers-reduced-motion: reduce` desactiva todas las animaciones decorativas.
- [ ] Usuario puede mover 1 muestra solo con teclado.
- [ ] Visibilidad cambiada durante drag cancela el drag.
- [ ] Resize de ventana durante drag cancela el drag.

---

## 10. Módulo G — Tests y verificación

### G.1 — Tests automatizados

#### Backend

```bash
cd backend && pnpm test
```

- `tests/group-move-preview.test.js` (8 tests)
- `tests/group-move-commit.test.js` (5 tests)

#### Frontend

```bash
cd frontend && pnpm test
```

- `hooks/useSampleSelection.test.js` (validación de tipo, status, dim, limit)
- `hooks/useGroupDrag.test.js` (ESC, visibility, resize)
- `hooks/useGroupPreview.test.js` (AbortController, requestId)

### G.2 — Tests manuales E2E

Checklist a verificar con la UI:

- [ ] Login → Almacén → seleccionar anaquel
- [ ] Multi-select 3 muestras del mismo tipo → toolbar muestra "3 × Producto X"
- [ ] Click muestra de otro tipo → `TypeMismatchModal` aparece
- [ ] Cancelar modal → selección intacta
- [ ] Reemplazar → selección queda en 1 muestra nueva
- [ ] Click "Mover Grupo" → mini-mapa aparece
- [ ] Drag sobre celda vacía → ghost verde
- [ ] Drag sobre celda adyacente a Tóxico → ghost rojo, tooltip, cursor not-allowed
- [ ] Soltar sobre celda inválida → shake, vuelve a origen
- [ ] Soltar sobre celda válida → `GroupConfirmModal` aparece con tabla
- [ ] Confirmar → las 3 muestras se mueven atómicamente
- [ ] Refrescar backend log → 3 movements con mismo `batch_id`
- [ ] Drag hacia mini-mapa → cross-level funciona
- [ ] ESC durante drag → cancela
- [ ] Alt-tab durante drag → cancela
- [ ] Resize durante drag → cancela
- [ ] `prefers-reduced-motion: reduce` activo → sin shake, sin pulse
- [ ] Mobile (<1280px) → mini-mapa se oculta con toggle
- [ ] Tab solo con teclado → alternativa keyboard funciona

### G.3 — No regresión

- [ ] Single-move flow (1 muestra) sigue funcionando
- [ ] Defragmentador sigue funcionando
- [ ] Place inicial sigue funcionando
- [ ] Build sin errores: `pnpm run electron:build`
- [ ] Lint pasa: `pnpm run lint`

---

## 11. Módulo H — Polish y release

### H.1 — Polish

- [ ] Tooltips informativos en cada elemento nuevo
- [ ] Breadcrumb toast tras commit exitoso: "3 muestras movidas con éxito"
- [ ] Breadcrumb toast tras commit con errores parciales
- [ ] Animaciones suaves (no más de 300ms para feedback)
- [ ] Estados loading visibles (spinners en preview y commit)
- [ ] Mensajes de error específicos (no genéricos)

### H.2 — Documentación

- [ ] Comentarios JSDoc en funciones nuevas
- [ ] README del módulo warehouse actualizado (si existe)
- [ ] CHANGELOG con las nuevas features

### H.3 — Release

- [ ] Tag de versión: `v1.X.0-group-move`
- [ ] Push a `main` con mensaje convencional: `feat(warehouse): drag-en-grupo con SGA preview en tiempo real`
- [ ] Build del instalador Electron: `pnpm run build:exe`
- [ ] Distribuir instalador a beta testers

---

## 12. Matriz de riesgos y fixes

| # | Riesgo | Fix | Archivo | Criticidad |
|---|--------|-----|---------|------------|
| 1 | `useGroupDrag` usa `levelSamples` filtrado en lugar de `groupSamples` completo | Usar `groupSamples` | `LevelDetailMap.jsx` | 🔴 |
| 2 | `useSampleSelection` no rechaza adiciones si count ≥ 10 | Validar antes de agregar | `useSampleSelection.js` | 🔴 |
| 3 | `useSampleSelection` no rechaza muestras con status ≠ 'stored' | Validar | `useSampleSelection.js` | 🔴 |
| 4 | `useSampleSelection` no rechaza muestras con dimensiones distintas | Validar | `useSampleSelection.js` | 🟠 |
| 5 | `commitGroupMove` no incluye `WHERE status = 'stored'` | Añadir al UPDATE | `group-operations.js` | 🔴 |
| 6 | `commitGroupMove` no hace INSERT en movements DENTRO de la transacción | Mover dentro del BEGIN/COMMIT | `group-operations.js` | 🔴 |
| 7 | `useGroupPreview` no cancela requests stale con AbortController | Implementar | `useGroupPreview.js` | 🟠 |
| 8 | Cambiar shelf mid-drag no cancela el drag | Implementar | `useGroupDrag.js` | 🟠 |
| 9 | Botón "Confirmar" no está disabled durante `isExecuting` | Implementar | `GroupConfirmModal.jsx` | 🟠 |
| 10 | `useGroupDrag` no resetea en visibilitychange | Listener | `useGroupDrag.js` | 🟡 |
| 11 | `useGroupDrag` no resetea en resize | Listener | `useGroupDrag.js` | 🟡 |
| 12 | `useGroupDrag` no respeta prefers-reduced-motion | Hook + condicional | `useGroupDrag.js` | 🟡 |
| 13 | Botón "Mover Grupo" no deshabilitado si `!canMove` | Prop + lógica | `GroupToolbar.jsx` | 🟠 |
| 14 | Modal de type-mismatch no intercepta clicks 3D | Backdrop del modal | `TypeMismatchModal.jsx` | 🟠 |
| 15 | Cache stale no se notifica al usuario | Hook + UI | `useShelfStaleness.js` | 🟡 |
| 16 | No hay breadcrumb de éxito tras commit | Toast | `ShelfMap3D.jsx` | 🟡 |
| 17 | Sin soporte keyboard | Hook + atajos | `useKeyboardGroupNav.js` | 🟠 |
| 18 | Mini-mapa no responsive | Media query + toggle | `ShelfMiniMap3D.jsx` | 🟠 |
| 19 | `@use-gesture/react` puede disparar onClick durante drag | No bindar onClick si `isSourceOfMove` | `SampleCube.jsx` | 🟠 |
| 20 | `previewGroupMove` no valida SGA class en enum | Defensa defensiva | `group-operations.js` | 🟡 |

---

## 13. Checklist de definición de hecho (DoD)

Cada módulo se considera completo cuando:

### Módulo A (Backend)
- [ ] `pnpm test` pasa con 13+ tests nuevos
- [ ] Los 2 endpoints funcionan vía `curl` manual
- [ ] `node --check` pasa en todos los archivos modificados
- [ ] Lint pasa

### Módulo B (Hooks)
- [ ] Los 3 hooks nuevos compilan sin errores
- [ ] `useSampleSelection` modificado pasa los tests
- [ ] Lint pasa

### Módulo C (3D)
- [ ] Drag-and-drop funciona con mouse
- [ ] SGA rings visibles en todos los cubos
- [ ] OrbitControls se deshabilita durante drag
- [ ] EmptyCellTarget cambia color según validity
- [ ] Build pasa sin warnings

### Módulo D (UI)
- [ ] GroupToolbar aparece con count > 1
- [ ] TypeMismatchModal funciona
- [ ] DimensionMismatchModal funciona
- [ ] GroupConfirmModal muestra tabla + disable durante execute
- [ ] Toast de éxito tras commit

### Módulo E (Mini-mapa)
- [ ] Mini-mapa renderiza correctamente
- [ ] Click en mini-mapa dispara drop en mapa principal
- [ ] Responsive <1280px funciona

### Módulo F (A11y)
- [ ] `prefers-reduced-motion` desactiva animaciones
- [ ] Keyboard nav funciona para mover
- [ ] Visibility y resize cancelan drag

### Módulo G (Tests)
- [ ] Tests E2E manuales pasan
- [ ] No regresión en single-move, defragment, place

### Módulo H (Release)
- [ ] `pnpm run build:exe` produce instalador funcional
- [ ] Instalador instalado abre la app correctamente
- [ ] Feature funciona en el instalador

---

## 14. Orden estricto de ejecución

```
Día 1-2:  Módulo A (Backend) — endpoints + tests
Día 2-3:  Módulo B (Hooks) — useGroupDrag, useGroupPreview, useSampleSelection
Día 3-4:  Módulo C (3D) — SampleCube drag, SGA rings, EmptyCellTarget states
Día 4:    Módulo D (UI) — GroupToolbar, GroupConfirmModal, TypeMismatchModal
Día 4-5:  Módulo E (Mini-mapa)
Día 5:    Módulo F (A11y) — keyboard nav, prefers-reduced-motion
Día 5:    Módulo G (Tests manuales E2E)
Día 5:    Módulo H (Polish + build + release)
```

**Regla de oro:** no avanzar al siguiente módulo hasta que el actual pase su checklist de DoD.

---

## Anexo A — Archivos finales

### Nuevos (10)

**Backend:**
- `backend/src/modules/warehouse/group-operations.js`
- `backend/tests/group-move-preview.test.js`
- `backend/tests/group-move-commit.test.js`

**Frontend:**
- `frontend/src/modules/warehouse/hooks/useGroupDrag.js`
- `frontend/src/modules/warehouse/hooks/useGroupPreview.js`
- `frontend/src/modules/warehouse/hooks/useShelfStaleness.js`
- `frontend/src/modules/warehouse/hooks/useKeyboardGroupNav.js`
- `frontend/src/modules/warehouse/hooks/usePrefersReducedMotion.js`
- `frontend/src/modules/warehouse/components/group/GroupDragGhost.jsx`
- `frontend/src/modules/warehouse/components/group/GroupToolbar.jsx`
- `frontend/src/modules/warehouse/components/group/GroupConfirmModal.jsx`
- `frontend/src/modules/warehouse/components/selection/TypeMismatchModal.jsx`
- `frontend/src/modules/warehouse/components/selection/DimensionMismatchModal.jsx`
- `frontend/src/modules/warehouse/components/minimap/ShelfMiniMap3D.jsx`

### Modificados (7)

- `backend/src/modules/warehouse/validations.js`
- `backend/src/modules/warehouse/routes.js`
- `backend/src/modules/warehouse/controller.js`
- `frontend/src/services/api.js`
- `frontend/src/modules/warehouse/hooks/useSampleSelection.js`
- `frontend/src/modules/warehouse/components/3d/Shared3DComponents.jsx`
- `frontend/src/modules/warehouse/components/3d/LevelDetailMap.jsx`
- `frontend/src/modules/warehouse/components/ShelfMap3D.jsx`

### Dependencias añadidas (1)

- `@use-gesture/react` (~10 KB gz)

---

## Anexo B — Glosario

- **Muestra hija** = `dispensed_samples` (botella individual dispensada de un bulk)
- **Muestra padre / global** = `global_samples` (el producto/lote original)
- **Tipo** = `global_sample_id` (identifica un producto específico)
- **SGA** = Sistema Globalmente Armonizado de clasificación de peligros químicos
- **Anaquel** = `shelves` (estructura física 3D con grid)
- **Celda** = posición `(x, y, z)` dentro de un anaquel
- **Bounding box del grupo** = cubo 3D mínimo que contiene todas las muestras del grupo
- **R3F** = React Three Fiber (renderer de Three.js para React)
- **Atomicidad transaccional** = propiedad ACID de DB: o se aplican todos los cambios o ninguno

---

**Estado del plan:** ✅ Aprobado pendiente de ejecución.
**Próximo paso:** comenzar con Módulo A (Backend).

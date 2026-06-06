# Release Notes v1.1.0 — Bottom Sheet UX (cero modales)

**Fecha**: 2026-06-05
**Tag**: v1.1.0
**Branch**: main
**Commits**: 6 nuevos sobre v1.0.0 (`cc98978`)

---

## Resumen ejecutivo

Reemplaza **todos los modales y tooltips flotantes** del módulo de
almacén por un único **bottom sheet contextual** con drag handle. El
usuario nunca pierde de vista el 3D map: los detalles de muestras,
grupos, confirmaciones y movimientos aparecen como un panel al pie
del detail map que se puede colapsar, expandir o arrastrar.

**Cero overlays**. Cero `position: fixed`. Cero z-index hacks. Cero
modales bloqueantes.

---

## Cambios por PR

### PR1 — BottomSheet + EmptyView + SampleDetailView (`2ea9a37`)
- Nuevo `BottomSheet.jsx`: contenedor con 3 snap points
  (collapsed 40px / default 50% / expanded 80%), drag handle,
  persistencia en localStorage, posición absolute al detail map
- Nuevo `BottomSheetHandle.jsx`: handle de 12px con pointer events
  (mouse + touch), click cicla, drag ajusta, doble-click reset
- Nuevo `EmptyView.jsx`: hint sutil (opacity adaptativa 0.7/0.35)
- Nuevo `SampleDetailView.jsx`: info de 1 muestra con SGA chip,
  data grid (lote, peso, dim, posición, vencimiento), botones
  Agregar/Quitar/Mover

### PR2 — GroupView + RejectBanner inline (`f9fe4f1`)
- Nuevo `GroupView.jsx`: panel con count + nombre producto + SGA +
  dimensions + stale indicator; chips removibles; footer con
  Limpiar/Mover grupo
- Nuevo `RejectBanner.jsx`: banner slide-down inline (no modal, no
  toast) con 6 tipos (type/dimension/limit/status/multiShelf/partial)
- **Archivos eliminados**: `GroupToolbar.jsx`, `GroupConfirmModal.jsx`,
  `TypeMismatchModal.jsx`, `DimensionMismatchModal.jsx`
- Keyframes `@slideDown` y `@pulse` en `index.css`

### PR3 — GroupConfirmView con mini-mapa (`0aa5b38`)
- Nuevo `GroupConfirmView.jsx`: header con icono + count, grid 2-col
  (mini-mapa 220×180 + meta con posición/anaquel/conflicts), shelf
  picker inline (select), validity bar con progress, footer
  Cancelar/Revisar
- `ShelfMiniMap3D.jsx`: nueva prop `compact` (220×180 vs 220×300)
- Auto-expand a 80% cuando `view === 'confirm'`

### PR4 — MovementView legacy eliminado (`2d8ebb3`)
- Nuevo `MovementView.jsx`: vista con 2 sub-estados
  - `moving`: wizard de asignación (progreso, siguiente muestra,
    picker inline, lista, footer Cancelar/Revisar)
  - `confirming`: preview con mini-mapa + lista rotable
- **Archivos eliminados** (carpeta `movement/` completa):
  `SampleMovementToolbar.jsx`, `MovementModeOverlay.jsx`,
  `TargetShelfPicker.jsx`, `MovementConfirmModal.jsx`
- `BottomSheet.jsx`: auto-expand rule extendida a `view === 'movement'`

### PR5 — Tooltip 3D eliminado (`c08208a`)
- `Shared3DComponents.jsx`: bloque `<Html position=[0, baseY+1.4, 0]>`
  flotante eliminado (60 líneas menos). El detalle ahora vive en
  `SampleDetailView` dentro del bottom sheet
- Cero z-fighting, cero clipping contra el canvas, cero posicionamiento 3D

### PR6 — Tests nuevos (`0fdaceb`)
- Nuevo `BottomSheet.test.js`: 8 tests (render, drag handle, cycle,
  close button, persistencia, auto-expand confirm/movement, double-click)
- Nuevo `EmptyView.test.js`: 2 tests (render + opacity adaptativa)
- Total: **52/52 tests OK (6 suites)**

---

## Archivos eliminados (8)

```
frontend/src/modules/warehouse/components/
├── group/
│   ├── GroupConfirmModal.jsx
│   └── GroupToolbar.jsx
├── movement/                        ← carpeta completa
│   ├── MovementConfirmModal.jsx
│   ├── MovementModeOverlay.jsx
│   ├── SampleMovementToolbar.jsx
│   └── TargetShelfPicker.jsx
└── selection/
    ├── DimensionMismatchModal.jsx
    └── TypeMismatchModal.jsx
```

## Archivos creados (11)

```
frontend/src/modules/warehouse/components/
├── bottom/
│   ├── BottomSheet.jsx
│   ├── BottomSheetHandle.jsx
│   ├── EmptyView.jsx
│   ├── GroupConfirmView.jsx
│   ├── MovementView.jsx
│   └── SampleDetailView.jsx
├── group/
│   ├── GroupView.jsx
│   └── RejectBanner.jsx
└── __tests__/
    ├── BottomSheet.test.js
    └── EmptyView.test.js
```

---

## Métricas

| Métrica | v1.0.0 | v1.1.0 | Delta |
|---|---|---|---|
| Tests frontend | 42 | 52 | +10 |
| Tests backend | 23 | 23 | 0 |
| Build size (gzip) | TBD | TBD | TBD |
| Modales en warehouse | 4 | 0 | -4 |
| Componentes warehouse | 19 | 22 | +3 (SampleView+Reject+Handle) |
| Archivos eliminados | — | 8 | -8 |
| Commits desde v1.0.0 | — | 6 | +6 |

---

## Flujos UX (antes → después)

### Ver detalles de una muestra
- **Antes**: click en cubo → tooltip 3D `<Html>` flotante 240px con
  z-index hack
- **Después**: click en cubo → bottom sheet colapsa a 40px y muestra
  `SampleDetailView` con toda la info

### Crear grupo de muestras
- **Antes**: 2+ seleccionadas → `GroupToolbar` flotante top-center
- **Después**: 2+ seleccionadas → bottom sheet auto-expande a 80%
  y muestra `GroupView` con chips

### Rechazo de tipo/dimensión
- **Antes**: click en muestra incompatible → `TypeMismatchModal` o
  `DimensionMismatchModal` con backdrop oscuro
- **Después**: click → `RejectBanner` inline slide-down en `GroupView`,
  sin backdrop, sin perder el 3D

### Confirmar drag-en-grupo
- **Antes**: drop → `GroupConfirmModal` con backdrop
- **Después**: drop → bottom sheet auto-expande y muestra
  `GroupConfirmView` con mini-mapa 3D del destino

### Mover muestras individuales
- **Antes**: 4 componentes (`SampleMovementToolbar` +
  `MovementModeOverlay` + `TargetShelfPicker` + `MovementConfirmModal`)
  con backdrop oscuro en cada paso
- **Después**: `MovementView` en bottom sheet con 2 sub-estados
  internos (`moving` + `confirming`), picker inline de anaquel

---

## Compatibilidad

- ✅ Single-move flow (no roto)
- ✅ Defragmentador (`DefragmentationTool` no afectado)
- ✅ Place inicial (no afectado)
- ✅ Cross-shelf drag (movido a `crossShelfButton` slot en `GroupView`)
- ✅ SGA validation (idéntica)
- ✅ Responsive <1280px (mini-mapa lateral se oculta automáticamente)
- ✅ LocalStorage: clave `handler.bottomSheet.<persistKey>` por defecto
  `handler.bottomSheet.detail`; se limpia automáticamente

## Regresiones conocidas
- Ninguna reportada.

---

## Próximos pasos (v1.2.0)

- [ ] Persistir `view` (collapsed/expanded) por anaquel en localStorage
- [ ] Animación de entrada del banner de reject (slide-down + fade)
- [ ] Soporte de teclado: `↑↓` para mover el sheet entre snap points
- [ ] Soporte de teclado: `Esc` para colapsar
- [ ] Mini-mapa arrastrable para reposicionar
- [ ] Settings: ocultar/mostrar el sheet por defecto

---

**Build artifacts** (no commiteados, on disk only):
- `frontend/dist-electron/Handler TrackSamples Setup 1.1.0.exe` (NSIS)
- `frontend/dist-electron/win-unpacked/Handler TrackSamples.exe`
- `backend/build/backend.exe`
- `backend/build/create_tables.exe`

**Repositorio**: https://github.com/Bromeropk12/Handler
**Documentación**: `Plan_movimientos.md` (raíz)

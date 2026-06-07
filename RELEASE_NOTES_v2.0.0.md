# Handler TrackSamples v2.0 — Floating Tooltip UX

**Fecha:** 2026-06-06 · **Commit:** `69250cf` · **Versión:** 2.0.0

## 🎯 Resumen

Reemplazamos el **bottom-sheet persistente** (v1.x) por un sistema de **UI flotante anclada al 3D**: tooltips sobre cubos, chips de grupo sobre muestras seleccionadas, y modales centrados solo cuando el usuario lo pide.

Resultado: 2,148 líneas eliminadas, 1,818 líneas añadidas, 0 panel persistente, 247/247 tests pasando.

## 🗑️ Eliminado (11 archivos)

### Componentes legacy
- `bottom/BottomSheet.jsx` (256) — el panel que se extendía
- `bottom/BottomSheetHandle.jsx` (104) — drag handle
- `bottom/EmptyView.jsx` (55) — placeholder vacío
- `bottom/SampleDetailView.jsx` (253) — vista de detalle dentro del sheet
- `bottom/GroupConfirmView.jsx` (298) — confirmación de grupo dentro del sheet
- `bottom/MovementView.jsx` (403) — wizard de movimiento dentro del sheet
- `group/GroupView.jsx` (231) — vista de grupo
- `group/RejectBanner.jsx` (152) — banner de rechazo

### Tests
- `__tests__/BottomSheet.test.js` (103)
- `__tests__/EmptyView.test.js` (20)

### Hook removido
- `useBottomSheetKeyboard` (en commit anterior, ya no aparecía en este diff)

## 🆕 Añadido (11 archivos)

### Componentes UI
- `3d/SampleTooltip.jsx` (172) — `<Html>` tooltip anclado al cubo: ID formateado, lote, peso, SGA, botones [Ver detalle] [Mover]
- `3d/GroupChip.jsx` (52) — `<Html>` mini-badge S-XXXX + dot SGA sobre cada cubo del grupo
- `ui/FloatingGroupBar.jsx` (179) — barra flotante bottom-center: count, nombre, badge SGA, 🟡 stale indicator, [Limpiar] [Mover grupo]
- `ui/SampleDetailModal.jsx` (226) — modal centrado con grid completo: lote, peso, SGA, estado, dim, vencimiento, posición, anaquel; [Cerrar] [Mover individual]
- `ui/MovementModal.jsx` (248) — modal centrado de confirmación: posición, anaquel (con badge "cruzado"), mini-mapa 220×160 opcional, barra validez, [Cancelar] [→ Mover N]
- `ui/ToastReject.jsx` (125) — toast top-center 3s auto-dismiss, [Reemplazar grupo] para type/dim/multiShelf

### Hook
- `hooks/useMovementMode.js` (125) — estado del modo "picking": `startMove(samples)`, `selectTarget(cell)`, `confirm/cancel/reset`; Esc → cancel; shelf change → cancel

### Tests (+23)
- `__tests__/useMovementMode.test.js` (8 tests) — idle, startMove, selectTarget, cancel, reset, Esc, no-op
- `__tests__/SampleTooltip.test.js` (5 tests) — render, lot/weight, [Ver detalle], [Mover], null sample
- `__tests__/GroupChip.test.js` (2 tests) — render S-XXXX, null
- `__tests__/FloatingGroupBar.test.js` (4 tests) — count < 2, render, stale, buttons
- `__tests__/SampleDetailModal.test.js` (4 tests) — null, full grid, onMoveSingle, onClose
- `__tests__/MovementModal.test.js` (5 tests) — null, single render, cross-shelf, conflicts disabled, onConfirm/onCancel
- `__tests__/ToastReject.test.js` (4 tests) — null, auto-dismiss 3s, onReplace, dimension type

## ✏️ Modificado

- `ShelfMap3D.jsx` (820 → 754 líneas) — borró `useSampleMovement`, `GroupDragGhost`, `ShelfMiniMap3D`; borró `groupConflicts`, `crossShelfData/Id/Open`; borró bloque mini-mapa cross-shelf; borró bloque BottomSheet completo con 4 sub-vistas; reemplazó por `<FloatingGroupBar>`, `<SampleDetailModal>`, `<MovementModal>`, `<ToastReject>`, indicador sutil de movement mode
- `Shared3DComponents.jsx` — añadidos imports `GroupChip` y `SampleTooltip`; añadido bloque `<Html>` para tooltip y chip en `SampleCube`; corregido `getSGAColor` lookup; removidas vars `statusLabel/statusTextColor` no usadas
- `LevelDetailMap.jsx` — añadidos 7 props nuevos (`movementMode`, `showTooltipFor`, `showGroupChipFor`, `groupChipColor`, `onTooltipViewDetail/Move/Close`); pasados a `<SampleCube>`
- `index.css` — añadidos 7 keyframes: `sampleTooltipIn`, `floatingBarIn`, `modalFadeIn`, `modalSlideUp`, `toastSlideDown`, `cellValidPulse`, `cellInvalidPulse`; removidas 2 líneas huérfanas que rompían el build
- `package.json` — bump `1.1.1 → 2.0.0`

## 🎨 Nuevo flujo de movimiento

### Single (1 muestra)
1. Click cubo → `SampleTooltip` aparece anclado
2. Click [→ Mover] → entra en `movementMode.isActive`
3. Celdas válidas se iluminan en verde (preview backend)
4. Click celda verde → `MovementModal` centrado
5. Click [→ Mover 1] → `POST /move-group` con `sample_ids: [1]`

### Group (2-10 muestras)
1. Multi-click cubos (mismo `global_sample_id` + mismas dim + status=`stored`)
2. Cada cubo del grupo muestra un `GroupChip` con S-XXXX
3. `FloatingGroupBar` aparece bottom-center
4. Click [→ Mover grupo] → entra en `movementMode.isActive`
5. Mismo flujo que single: click celda verde → modal → confirmar

### Cross-shelf (futuro)
`MovementModal` ya soporta `mapData` para mini-mapa del destino. Por ahora, picking solo dentro del anaquel actual; cross-shelf via `mapData` está en v2.1.

## 🐛 Bugs corregidos

1. **CSS build break**: 2 líneas huérfanas tras `cellInvalidPulse` (`50% { opacity: 0.45; }` + `}`) que causaban "Unexpected } (584:1)". Removidas.
2. **`danger_class` vs `dangerClass`**: `useSampleSelection` expone `dangerClass` (camelCase). `FloatingGroupBar` y `ShelfMap3D` referenciaban `danger_class` (snake). Ambos corregidos.
3. **`setCrossShelfOpen(undefined)`**: referencia a variable no declarada en effect. Eliminado junto con el bloque cross-shelf legacy completo.
4. **`movement.startMove(samples, selectedShelf)`**: signature antigua; el nuevo `useMovementMode.startMove(samples)` no toma shelfId. Corregido en `onConfirm` del MovementModal.
5. **`movement.mode === 'moving'`**: legacy hook. Reemplazado por `isMoving = movementMode.isActive` en `ShelfOverviewMap` y `LevelDetailMap`.
6. **Doble invocación de `useSampleMovement`**: eliminado; ahora `useMovementMode` es la única autoridad sobre el flujo de movimiento.
7. **Picking de celda no movía preview**: faltaba `useEffect` que dispara `groupPreview.loadPreview` al entrar en `movementMode`. Añadido.

## 🧪 Tests

| Suite | v1.1.1 | v2.0.0 | Δ |
|-------|--------|--------|---|
| backend | 166/166 | 166/166 | 0 |
| frontend | 70/70 | 81/81 | +11 (neto tras -2 deleted) |
| **Total** | **236/236** | **247/247** | **+11 tests** |

Test files: 12 backend + 12 frontend = **24 suites passing**.

## 📊 Bundle

```
File sizes after gzip:
  633.86 kB  build/static/js/main.7556a120.js
   14.09 kB  build/static/css/main.bb255666.css
    1.77 kB  build/static/js/232.956c5889.chunk.js
```

CSS bajó de ~12KB a 14KB (+2KB por los 7 keyframes nuevos).
JS subió de ~620KB a 634KB (+14KB por las 6 vistas/modales nuevos y el hook).

## 🚀 Migración desde v1.x

No se requieren migraciones de datos. Cambios visibles:
- Ya no hay panel inferior persistente
- Click en cubo ahora muestra un tooltip 3D en vez de abrir el sheet
- Para mover, hay que clickear [→ Mover] en el tooltip o [→ Mover grupo] en el bar flotante
- Confirmación de movimiento es un modal centrado, no un sheet
- Errores de selección son toasts top-center 3s, no banners dentro del sheet

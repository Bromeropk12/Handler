# Release Notes — v1.0.0 (Drag-en-Grupo 3D)

## Highlight: Drag-en-Grupo 3D con validación SGA en tiempo real

Re-implementación completa del flujo de movimiento de muestras en el mapa 3D
del módulo Almacén. Ahora es posible seleccionar múltiples muestras
hermanas (mismo `global_sample_id`, mismo SGA, mismas dimensiones) y
moverlas todas en una sola operación atómica con preview de
compatibilidad SGA bloqueante en tiempo real.

## Cambios principales

### Backend
- **Módulo A — `group-operations.js`**: nuevas funciones `previewGroupPlacement`
  y `commitGroupMove` con commit transaccional PostgreSQL, columna `batch_id`
  UUID en `movements` para audit trail, AABB check, SGA check per cell,
  defense-in-depth de tipo/dimensiones/status/shelf. 23 tests nuevos
  (166/166 pasan en 12 suites).
- **Migración `003`**: añade `batch_id UUID NULL` + partial index a `movements`.
- **Endpoints nuevos**:
  - `POST /api/warehouse/:id/preview-move-group` (warehouse.view)
  - `PUT  /api/warehouse/:id/move-group` (warehouse.move_sample)

### Frontend
- **Módulo B — Hooks (5 nuevos)**:
  - `useSampleSelection`: validación tipo/dim/status/límite/multi-shelf + rejectionEvent
  - `useGroupDrag`: state machine drag con listeners ESC/visibility/resize
  - `useGroupPreview`: cache local con AbortController + requestId
  - `useShelfStaleness`: polling 30s para detectar cambios remotos
  - `useKeyboardGroupNav`: M/Enter/Esc/arrows/Shift+arrows
  - `usePrefersReducedMotion`: media query observer
- **Módulo C — 3D**:
  - `SampleCube`: anillo SGA coloreado (6 clases) + onPointerDown para drag-en-grupo
  - `EmptyCellTarget`: validityState (valid/invalid/unknown) con cursor semántico
  - `LevelDetailMap`: pasa drag handlers + desactiva OrbitControls durante drag
  - `@use-gesture/react 10.3.1` instalado (reservado para futuras interacciones)
- **Módulo D — UI (5 componentes nuevos)**:
  - `GroupToolbar`: count + producto + SGA + cross-shelf + indicator stale
  - `GroupConfirmModal`: confirmación pre-commit con lista + destino + conflictos
  - `TypeMismatchModal`, `DimensionMismatchModal`: rechazar / reemplazar
  - `GroupDragGhost`: R3F ghost translúcido con halo por validity
- **Módulo E — Mini-mapa 3D cross-shelf**:
  - `ShelfMiniMap3D`: Canvas R3F 220×300 con auto-rotation, click-to-drop
  - Botón "⤢ Cambiar anaquel" en GroupToolbar con dropdown inline
  - Responsive: oculta en viewports <1280px
- **Módulo G — Tests** (28 nuevos):
  - 13 tests `useSampleSelection`
  - 8 tests `useGroupDrag`
  - 6 tests `useGroupPreview`
  - Refactor crítico encontrado por tests: `useSampleSelection` usaba
    side-effect en updater de `setState` (illegal en React 18). Migrado a
    `useState` combinado `{map, type, rejection}` con reducer puro.

## Restricciones del drag-en-grupo (validadas en backend + frontend)

| Restricción | Frontend | Backend | Mensaje al usuario |
|-------------|----------|---------|---------------------|
| Mismo `global_sample_id` | ✅ | ✅ | "Tipo de muestra diferente" |
| Mismas dimensiones | ✅ | ✅ | "Dimensiones incompatibles" |
| Solo status='stored' | ✅ | ✅ | (rechazo silencioso en UI) |
| Max 10 muestras | ✅ | ✅ | "Límite de 10 alcanzado" |
| Mismo shelf origen | ✅ | ✅ | "No se puede mover entre anaqueles" |
| SGA compatible (preview) | ✅ (real-time) | ✅ | Cursor `not-allowed` + halo rojo |
| SGA compatible (commit) | — | ✅ (transaccional) | 400 + rollback |

## Auditoría y seguridad
- Cada move-en-grupo genera un `batch_id` UUID compartido en `movements`,
  permitiendo reconstruir exactamente qué muestras se movieron juntas.
- Commit atómico PostgreSQL: si CUALQUIER muestra falla, TODO se hace rollback.
- Logs sanitizados (sistema `sanitizer.js` previo) + CORS LAN-safe (regex
  privada) sin cambios.

## Build
- Frontend build: `pnpm run build` (OK, +6.3 kB gzip)
- Backend exe: `pnpm run build:all` → `backend.exe` (60.6 MB)
- Installer: `pnpm run electron:build` → `Handler TrackSamples Setup 1.0.0.exe` (174 MB NSIS)
- Win-unpacked: `Handler TrackSamples.exe` (212.7 MB)

## Test summary
- Backend: 166/166 tests OK (12 suites, 8.0s)
- Frontend: 41/42 tests OK (4 suites, 1 pre-existing flaky fast-check
  en `validations.test.js`, no relacionado con drag-en-grupo)
- ESLint: 0 errors en código de warehouse

## Commits incluidos
```
65d8bf2 feat(warehouse): Módulo G - tests frontend con React Testing Library
e1c0353 feat(warehouse): botón cross-shelf en GroupToolbar con mini-picker
e351128 feat(warehouse): Módulo E - mini-mapa 3D cross-shelf
6787530 feat(warehouse): Módulo D.5 - wiring de group flow en ShelfMap3D
a3276f3 feat(warehouse): Módulo D UI - modales y toolbar de grupo
e558b64 feat(warehouse): Módulo C 3D - SGA ring + drag-en-grupo events
3367d20 feat(warehouse): drag-en-grupo hooks (Módulo B)
1cfea16 feat(warehouse): Módulo A - backend drag-en-grupo con SGA y commit atómico
```

## Pendiente (futuras versiones)
- Dropdown de anaqueles en `GroupToolbar` filtrado por `market_line_id` (UI
  trigger del cross-shelf ya implementado en backend).
- Visualización del `GroupDragGhost` en el canvas principal (reservado, el
  feedback visual ya viene de `validityState` + SGA ring + halo).
- A11y tests automatizados con `@testing-library/jest-dom` axe-core.
- E2E tests con Playwright (flujo drag-en-grupo).

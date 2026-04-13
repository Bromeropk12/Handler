# 🧊 PLAN: MÓDULO ALMACÉN 3D COMPLETO

## 📊 ESTADO ACTUAL vs ESTADO DESEADO

### Actual (2D forzado)
```
Schema: grid_width (X) × grid_height (Y)
Frontend: Matriz 2D[Y][X]
Backend: Validaciones 2D (x, y)
```

### Deseado (3D real)
```
Schema: grid_width (X) × grid_height (Y) × shelf_depth (Z)
Frontend: Matriz 3D[Y][Z][X] con Three.js
Backend: Validaciones 3D (x, y, z)
Desfragmentación: Algoritmo 3D con profundidad
```

---

## 🏗️ CAMBIOS REQUERIDOS

### FASE 1: Schema de Base de Datos 3D

#### Tarea 1.1: Agregar columna `shelf_depth` a tabla `shelves`
```sql
ALTER TABLE shelves 
ADD COLUMN shelf_depth INTEGER NOT NULL DEFAULT 10 
CHECK (shelf_depth > 0 AND shelf_depth <= 50);

-- Actualizar total_capacity para incluir profundidad
ALTER TABLE shelves 
DROP COLUMN total_capacity;

ALTER TABLE shelves 
ADD COLUMN total_capacity INTEGER 
GENERATED ALWAYS AS (grid_width * grid_height * shelf_depth) STORED;
```

#### Tarea 1.2: Crear script de migración
```sql
-- migration-002-add-shelf-depth.sql
-- Agrega shelf_depth a anaqueles existentes
```

#### Tarea 1.3: Actualizar `init.sql`
- Agregar `shelf_depth` en CREATE TABLE shelves
- Actualizar INSERT de anaqueles con valores de profundidad

---

### FASE 2: Backend 3D

#### Tarea 2.1: Actualizar `backend/src/modules/warehouse/validations.js`
- `validatePlacement(shelf, sample, x, y, z)` - Agregar parámetro Z
- `findAutoPlacement(shelf, sample)` - Buscar en 3D (x, y, z)
- `rectanglesOverlap` → `boxesOverlap` para 3D
- `getNeighbors` - Incluir vecinos en eje Z

#### Tarea 2.2: Actualizar `backend/src/modules/warehouse/map-operations.js`
- `generateGridMatrix` → `generateGridMatrix3D` (Y × Z × X)
- `placeSample` - Incluir position_z
- `moveSample` - Incluir new_position_z
- `removeSample` - Incluir position_z en oldPosition

#### Tarea 2.3: Actualizar `backend/src/utils/defragmentation.js`
- `buildOccupancyMap` - Matriz 3D [y][z][x]
- `findFreeBlock` - Buscar bloque 3D (w × h × d)
- `findRelocationSpot` - Incluir eje Z en búsqueda
- `calculateDefragmentation` - Plan 3D completo

#### Tarea 2.4: Actualizar `backend/src/modules/warehouse/shelf-operations.js`
- CRUD de anaqueles con campo `shelf_depth`
- Validaciones de profundidad

---

### FASE 3: Frontend 3D Completo

#### Tarea 3.1: Actualizar `ShelfMap3D.jsx`
- Matriz 3D real: `gridMatrix3D[level][depth][column]`
- Selector de nivel (Y) - ya existe
- Selector de profundidad (Z) - **nuevo**
- Canvas Three.js con cajas 3D posicionadas correctamente

#### Tarea 3.2: Actualizar `SampleMesh` component
- Posición 3D: `[offsetX + x, y, offsetZ + z]`
- Animaciones 3D con levitación en Y
- Tooltip con coordenadas (X, Y, Z)

#### Tarea 3.3: Actualizar `DefragmentationTool.jsx`
- Mostrar coordenadas 3D en instrucciones
- "Mover muestra de (X:1, Y:2, Z:3) a (X:5, Y:0, Z:2)"
- Visualización 3D del movimiento sugerido

#### Tarea 3.4: Actualizar `warehouseAPI`
- `defragment(id, { target_width, target_height, target_depth })`
- `placeSample(id, { sample_id, position_x, position_y, position_z })`

---

### FASE 4: Tests

#### Tarea 4.1: Tests para defragmentation.js
- Test buildOccupancyMap 3D
- Test findFreeBlock 3D
- Test findRelocationSpot con SGA
- Test calculateDefragmentation completo

#### Tarea 4.2: Tests para validations.js 3D
- Test validatePlacement 3D
- Test boxesOverlap
- Test findAutoPlacement 3D

---

## 📐 ESPECIFICACIÓN TÉCNICA 3D

### Grid 3D del Anaquel
```
         Y (Nivel/Altura)
         ↑
         |
         |  Z (Profundidad)
         | ↗
         |/
         +--------→ X (Columna)
```

### Dimensiones de Muestras
| Dimensión | Significado | Valores |
|-----------|-------------|---------|
| width | Ocupación en X (columnas) | 1 o 2 |
| height | Ocupación en Y (niveles) | 1 o 2 |
| depth | Ocupación en Z (profundidad) | 1 o 2 |

### Enum de Dimensiones (actualizar)
```sql
-- Actualizar enum para incluir profundidad
DROP TYPE IF EXISTS dimensions;
CREATE TYPE dimensions AS ENUM ('1x1x1', '1x2x1', '2x1x1', '2x2x1', '1x1x2', '1x2x2', '2x1x2', '2x2x2');
-- Formato: Ancho(x) x Alto(y) x Profundidad(z)
```

### Coordenadas en UI
```
Columna: 1 a grid_width (X)
Nivel: 1 a grid_height (Y)  
Profundidad: 1 a shelf_depth (Z)
```

---

## 🎨 UI/UX 3D

### Vista Isométrica Three.js
- Cámara orbital con rotación libre
- Grid helper 3D visible
- Cajas con colores por estado (ocupado, vencido, alerta)
- Hover muestra coordenadas (X, Y, Z)
- Click muestra detalles de muestra

### Panel de Niveles (Y)
- Selector vertical de niveles
- Indicador visual del nivel activo
- Muestras por nivel

### Panel de Profundidad (Z) - NUEVO
- Selector horizontal de profundidad
- Visualización de corte en Z
- Muestras en esa profundidad

### Herramienta de Desfragmentación 3D
- Instrucciones con coordenadas 3D completas
- "Mover muestra X del nivel Y, profundidad Z al nivel Y', profundidad Z'"
- Preview del movimiento en el canvas 3D

---

## 📋 ORDEN DE EJECUCIÓN

1. **Schema BD** (30 min) - Agregar shelf_depth
2. **Backend validations 3D** (1h) - Actualizar validaciones
3. **Backend map-operations 3D** (1h) - Actualizar operaciones
4. **Backend defragmentation 3D** (1.5h) - Algoritmo 3D
5. **Frontend ShelfMap3D** (2h) - Matriz 3D + UI
6. **Frontend DefragmentationTool 3D** (1h) - Coordenadas 3D
7. **Tests** (1.5h) - Tests de defragmentación y validations
8. **Integración y pruebas** (1h) - Verificar todo junto

**Total estimado: ~9 horas**

---

## ⚠️ RIESGOS

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Cambios en schema rompen datos existentes | Alto | Script de migración con defaults |
| Algoritmo 3D más lento | Medio | Optimizar con early-exit |
| Canvas 3D pesado con muchas muestras | Medio | InstancedMesh en Three.js |
| Coordenadas confusas para el usuario | Medio | UI clara con labels X, Y, Z |

# Propuesta de Arquitectura: Mapa 2D de Anaqueles

## 🎯 Objetivo
Crear un sistema visual interactivo para gestionar la ubicación física de muestras individuales en anaqueles, con navegación jerárquica: Línea Comercial → Anaquel → Mapa 2D.

---

## 📐 Arquitectura del Sistema de Anaqueles

### 1. Modelo de Datos (Backend)

#### Tabla `shelves` (Ya existe, actualizar)
```sql
CREATE TABLE shelves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_line_id UUID NOT NULL REFERENCES market_lines(id),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100), -- BASF, JRS, THOR, etc.
    grid_width INTEGER NOT NULL DEFAULT 10, -- Ancho del grid (columnas)
    grid_height INTEGER NOT NULL DEFAULT 10, -- Alto del grid (filas)
    total_capacity INTEGER NOT NULL, -- Total de celdas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_line_id, name)
);
```

#### Tabla `dispensed_samples` (Ya existe, validar)
```sql
-- Ya tiene: shelf_id, position_x, position_y
-- Agregar: width, height para dimensiones (1x1, 1x2, 2x1, 2x2)
ALTER TABLE dispensed_samples 
ADD COLUMN width INTEGER DEFAULT 1,
ADD COLUMN height INTEGER DEFAULT 1;
```

### 2. API Backend (Módulo Warehouse)

#### Endpoints Requeridos
```javascript
// CRUD de Anaqueles
GET    /api/warehouse/shelves                    // Listar todos
GET    /api/warehouse/shelves/:id                // Detalle de anaquel
POST   /api/warehouse/shelves                    // Crear anaquel
PUT    /api/warehouse/shelves/:id                // Actualizar anaquel
DELETE /api/warehouse/shelves/:id                // Eliminar anaquel

// Gestión del Mapa 2D
GET    /api/warehouse/shelves/:id/map            // Obtener mapa completo del anaquel
POST   /api/warehouse/shelves/:id/place-sample   // Colocar muestra en posición
PUT    /api/warehouse/shelves/:id/move-sample    // Mover muestra
DELETE /api/warehouse/shelves/:id/remove-sample  // Quitar muestra

// Filtros y Búsqueda
GET    /api/warehouse/shelves/by-line/:market_line_id  // Por línea comercial
GET    /api/warehouse/shelves/by-provider/:provider    // Por proveedor
```

---

## 🎨 Diseño del Frontend (React + TailwindCSS)

### Navegación Jerárquica (3 Niveles)

#### **Nivel 1: Selector de Línea Comercial**
```
┌─────────────────────────────────────────────┐
│  Seleccione Línea Comercial                 │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Cosmética│  │ Industria│  │  Farma   │ │
│  │  (5)     │  │  (3)     │  │  (6)     │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────┘
```

#### **Nivel 2: Selector de Anaquel**
```
┌─────────────────────────────────────────────┐
│  Cosmética > Seleccione Anaquel             │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ BASF #1  │  │ BASF #2  │  │ BASF #3  │ │
│  │ 80% lleno│  │ 60% lleno│  │ 45% lleno│ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │  JRS #1  │  │ THOR #1  │                │
│  │ 90% lleno│  │ 70% lleno│                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
```

#### **Nivel 3: Mapa 2D del Anaquel**
```
┌─────────────────────────────────────────────────────────┐
│  Cosmética > BASF #1 > Mapa 2D                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  0  1  2  3  4  5  6  7  8  9                  │   │
│  │0 ██ ██ ░░ ░░ ██ ██ ██ ██ ░░ ░░                │   │
│  │1 ██ ██ ░░ ░░ ██ ██ ██ ██ ░░ ░░                │   │
│  │2 ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██                │   │
│  │3 ██ ██ ██ ██ ░░ ░░ ░░ ░░ ██ ██                │   │
│  │4 ██ ██ ██ ██ ░░ ░░ ░░ ░░ ░░ ░░                │   │
│  │5 ░░ ░░ ░░ ░░ ██ ██ ██ ██ ░░ ░░                │   │
│  │6 ░░ ░░ ░░ ░░ ██ ██ ██ ██ ░░ ░░                │   │
│  │7 ██ ██ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██                │   │
│  │8 ██ ██ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██                │   │
│  │9 ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Leyenda:                                               │
│  ██ = Ocupado  ░░ = Vacío  🔴 = Vencido  🟡 = Próximo │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura Frontend Modular

### Estructura de Componentes
```
frontend/modules/warehouse/
├── components/
│   ├── MarketLineSelector.jsx      // Nivel 1: Selector de línea
│   ├── ShelfSelector.jsx           // Nivel 2: Selector de anaquel
│   ├── ShelfMap2D.jsx              // Nivel 3: Mapa interactivo
│   ├── GridCell.jsx                // Celda individual del grid
│   ├── SampleTooltip.jsx           // Tooltip con info de muestra
│   └── ShelfCRUD.jsx               // CRUD de anaqueles
├── hooks/
│   ├── useShelfData.js             // Hook para datos de anaquel
│   ├── useGridInteraction.js       // Hook para interacción con grid
│   └── useSamplePlacement.js       // Hook para colocar muestras
├── services/
│   └── warehouseService.js         // API calls
└── utils/
    ├── gridCalculations.js         // Cálculos de posiciones
    └── colorSchemes.js             // Esquemas de colores SGA
```

---

## 🎨 Diseño Visual del Mapa 2D

### Tecnología: CSS Grid
```css
.shelf-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap: 4px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.grid-cell {
  aspect-ratio: 1;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.grid-cell.occupied {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #1d4ed8;
}

.grid-cell.empty {
  background: white;
  border-color: #d1d5db;
}

.grid-cell.expired {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  animation: pulse 2s infinite;
}

.grid-cell.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

/* Dimensiones variables */
.grid-cell.size-1x2 {
  grid-column: span 1;
  grid-row: span 2;
}

.grid-cell.size-2x1 {
  grid-column: span 2;
  grid-row: span 1;
}

.grid-cell.size-2x2 {
  grid-column: span 2;
  grid-row: span 2;
}
```

### Esquema de Colores por Estado
- **Vacío**: Blanco/Gris claro (`#ffffff`)
- **Ocupado**: Azul gradiente (`#3b82f6`)
- **Vencido**: Rojo pulsante (`#ef4444`)
- **Próximo a vencer**: Amarillo/Naranja (`#f59e0b`)
- **Seleccionado**: Borde verde brillante (`#10b981`)

### Esquema de Colores por Clase SGA
- **Sin Riesgo**: Verde (`#22c55e`)
- **Inflamable**: Naranja (`#f97316`)
- **Corrosivo**: Amarillo (`#eab308`)
- **Tóxico**: Rojo (`#ef4444`)
- **Comburente**: Azul (`#3b82f6`)
- **Explosivo**: Morado (`#a855f7`)

---

## 🔧 Funcionalidades del Mapa 2D

### Interacciones del Usuario
1. **Hover**: Mostrar tooltip con info de muestra (nombre, lote, peso, vencimiento)
2. **Click**: Seleccionar celda para ver detalles completos
3. **Drag & Drop** (opcional): Mover muestras entre posiciones
4. **Zoom**: Acercar/alejar para anaqueles grandes
5. **Filtros**: Por estado, clase SGA, proveedor

### Información en Tooltip
```
┌─────────────────────────────┐
│ Vitamina C Premium          │
│ Lote: VC-2024-001           │
│ Peso: 50g                   │
│ Vence: 2025-12-31           │
│ Clase: Sin Riesgo           │
│ Posición: (3, 5)            │
│ [Ver Detalles] [Despachar]  │
└─────────────────────────────┘
```

---

## 🚀 Flujo de Implementación Propuesto

### Fase 1: Backend (Módulo Warehouse)
1. Actualizar tabla `shelves` con campos de grid
2. Crear API CRUD para anaqueles
3. Implementar endpoints de mapa 2D
4. Validaciones de posicionamiento (no overlap)
5. Tests completos

### Fase 2: Frontend (Componentes Base)
1. `MarketLineSelector`: Cards con estadísticas
2. `ShelfSelector`: Grid de anaqueles con % ocupación
3. `ShelfCRUD`: Formulario para gestionar anaqueles

### Fase 3: Mapa 2D Interactivo
1. `ShelfMap2D`: Grid principal con CSS Grid
2. `GridCell`: Componente individual con estados
3. `SampleTooltip`: Información detallada
4. Lógica de posicionamiento y validación

### Fase 4: Interacciones Avanzadas
1. Drag & drop para reubicación
2. Algoritmo de sugerencia de posición
3. Validación de compatibilidad SGA
4. Animaciones y transiciones

---

## 🎨 Mockup Visual Propuesto

### Nivel 1: Selector de Línea
```
┌────────────────────────────────────────────────────────┐
│  📦 Gestión de Almacén                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Seleccione Línea Comercial:                          │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  💄 Cosmética │  │  🏭 Industria │  │  💊 Farma    ││
│  │              │  │              │  │              ││
│  │  5 Anaqueles │  │  3 Anaqueles │  │  6 Anaqueles ││
│  │  75% Ocupado │  │  60% Ocupado │  │  85% Ocupado ││
│  │              │  │              │  │              ││
│  │  [Ver →]     │  │  [Ver →]     │  │  [Ver →]     ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Nivel 2: Selector de Anaquel
```
┌────────────────────────────────────────────────────────┐
│  📦 Cosmética > Anaqueles                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  BASF #1     │  │  BASF #2     │  │  BASF #3     ││
│  │  10x10 Grid  │  │  10x10 Grid  │  │  10x10 Grid  ││
│  │  80/100      │  │  60/100      │  │  45/100      ││
│  │  [Ver Mapa]  │  │  [Ver Mapa]  │  │  [Ver Mapa]  ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                        │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │  JRS #1      │  │  THOR #1     │                  │
│  │  10x10 Grid  │  │  10x10 Grid  │                  │
│  │  90/100      │  │  70/100      │                  │
│  │  [Ver Mapa]  │  │  [Ver Mapa]  │                  │
│  └──────────────┘  └──────────────┘                  │
│                                                        │
│  [+ Crear Nuevo Anaquel]                              │
└────────────────────────────────────────────────────────┘
```

### Nivel 3: Mapa 2D Interactivo
```
┌────────────────────────────────────────────────────────────────┐
│  📦 Cosmética > BASF #1 > Mapa 2D                              │
├────────────────────────────────────────────────────────────────┤
│  Ocupación: 80/100 (80%)  |  Alertas: 2 vencidos, 5 próximos  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Grid 10x10                                            │   │
│  │  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                      │   │
│  │  │██│██│░░│░░│██│██│██│██│░░│░░│  0                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │██│██│░░│░░│██│██│██│██│░░│░░│  1                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │░░│░░│░░│░░│░░│░░│░░│░░│██│██│  2                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │██│██│██│██│░░│░░│░░│░░│██│██│  3                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │██│██│██│██│░░│░░│░░│░░│░░│░░│  4                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │░░│░░│░░│░░│██│██│██│██│░░│░░│  5                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │░░│░░│░░│░░│██│██│██│██│░░│░░│  6                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │██│██│░░│░░│░░│░░│░░│░░│██│██│  7                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │██│██│░░│░░│░░│░░│░░│░░│██│██│  8                   │   │
│  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                      │   │
│  │  │░░│░░│░░│░░│░░│░░│░░│░░│░░│░░│  9                   │   │
│  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                      │   │
│  │   0  1  2  3  4  5  6  7  8  9                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  Filtros: [Todos] [Vencidos] [Próximos] [Por Clase SGA]      │
│  Acciones: [Organizar Pendientes] [Desfragmentar]            │
└────────────────────────────────────────────────────────────────┘
```

---

## 💻 Código Propuesto (Estructura)

### 1. Componente Principal: `ShelfMap2D.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import GridCell from './GridCell';
import SampleTooltip from './SampleTooltip';
import { useShelfData } from '../hooks/useShelfData';

const ShelfMap2D = ({ shelfId }) => {
  const { shelf, samples, loading, error } = useShelfData(shelfId);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Crear matriz 2D del grid
  const gridMatrix = useMemo(() => {
    const matrix = Array(shelf.grid_height).fill(null).map(() => 
      Array(shelf.grid_width).fill(null)
    );

    // Colocar muestras en la matriz
    samples.forEach(sample => {
      for (let y = 0; y < sample.height; y++) {
        for (let x = 0; x < sample.width; x++) {
          if (matrix[sample.position_y + y] && matrix[sample.position_y + y][sample.position_x + x] !== undefined) {
            matrix[sample.position_y + y][sample.position_x + x] = sample;
          }
        }
      }
    });

    return matrix;
  }, [samples, shelf]);

  return (
    <div className="shelf-map-container">
      <div className="grid-wrapper" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${shelf.grid_width}, 1fr)`,
        gridTemplateRows: `repeat(${shelf.grid_height}, 1fr)`,
        gap: '4px'
      }}>
        {gridMatrix.map((row, y) => 
          row.map((cell, x) => (
            <GridCell
              key={`${x}-${y}`}
              sample={cell}
              position={{ x, y }}
              onHover={setHoveredCell}
              onClick={setSelectedCell}
            />
          ))
        )}
      </div>

      {hoveredCell && (
        <SampleTooltip sample={hoveredCell} />
      )}
    </div>
  );
};
```

### 2. Componente: `GridCell.jsx`
```javascript
const GridCell = ({ sample, position, onHover, onClick }) => {
  const getCellClass = () => {
    if (!sample) return 'empty';
    if (isExpired(sample.expiration_date)) return 'expired';
    if (isNearExpiry(sample.expiration_date, 30)) return 'warning';
    return 'occupied';
  };

  const getCellColor = () => {
    if (!sample) return '#ffffff';
    return SGA_COLORS[sample.ghs_danger_class] || '#3b82f6';
  };

  return (
    <div
      className={`grid-cell ${getCellClass()}`}
      style={{
        backgroundColor: getCellColor(),
        gridColumn: sample ? `span ${sample.width}` : 'span 1',
        gridRow: sample ? `span ${sample.height}` : 'span 1'
      }}
      onMouseEnter={() => onHover(sample)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(sample)}
    >
      {sample && (
        <div className="cell-content">
          <span className="sample-name">{sample.name.substring(0, 10)}</span>
          <span className="sample-lot">{sample.lot}</span>
        </div>
      )}
    </div>
  );
};
```

### 3. Hook: `useShelfData.js`
```javascript
import { useState, useEffect } from 'react';
import warehouseService from '../services/warehouseService';

export const useShelfData = (shelfId) => {
  const [shelf, setShelf] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShelfData = async () => {
      try {
        setLoading(true);
        const shelfData = await warehouseService.getShelfById(shelfId);
        const mapData = await warehouseService.getShelfMap(shelfId);
        
        setShelf(shelfData);
        setSamples(mapData.samples);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (shelfId) {
      fetchShelfData();
    }
  }, [shelfId]);

  return { shelf, samples, loading, error };
};
```

---

## 🔐 Validaciones de Posicionamiento

### Reglas de Negocio
1. **No Overlap**: Una celda no puede tener dos muestras
2. **Dimensiones Válidas**: Muestra 2x2 necesita 4 celdas contiguas libres
3. **Límites del Grid**: No puede exceder grid_width x grid_height
4. **Compatibilidad SGA**: Validar vecinos según matriz de peligros

### Algoritmo de Validación (Backend)
```javascript
function validatePlacement(shelf, sample, position_x, position_y) {
  // 1. Verificar límites
  if (position_x + sample.width > shelf.grid_width) {
    throw new Error('Muestra excede límite horizontal');
  }
  if (position_y + sample.height > shelf.grid_height) {
    throw new Error('Muestra excede límite vertical');
  }

  // 2. Verificar overlap
  const occupiedCells = getOccupiedCells(shelf.id);
  for (let y = 0; y < sample.height; y++) {
    for (let x = 0; x < sample.width; x++) {
      const cellKey = `${position_x + x},${position_y + y}`;
      if (occupiedCells.has(cellKey)) {
        throw new Error('Posición ya ocupada');
      }
    }
  }

  // 3. Verificar compatibilidad SGA
  const neighbors = getNeighbors(shelf.id, position_x, position_y, sample.width, sample.height);
  if (!isCompatibleWithNeighbors(sample.ghs_danger_class, neighbors)) {
    throw new Error('Incompatibilidad química con vecinos');
  }

  return true;
}
```

---

## 🎯 Propuesta de Implementación

### Opción A: CSS Grid Puro (Recomendado)
**Pros:**
- Nativo, sin dependencias
- Excelente performance
- Responsive por defecto
- Fácil de estilizar

**Contras:**
- Drag & drop requiere librería adicional
- Animaciones más complejas

### Opción B: React DnD + CSS Grid
**Pros:**
- Drag & drop nativo
- Interacciones avanzadas
- Animaciones fluidas

**Contras:**
- Dependencia adicional
- Curva de aprendizaje

### Opción C: Canvas HTML5
**Pros:**
- Performance extrema para grids grandes
- Control total de renderizado

**Contras:**
- Más complejo de implementar
- Menos accesible
- Difícil de estilizar

---

## 🚦 Mi Recomendación

**Implementar Opción A (CSS Grid Puro)** con las siguientes características:

1. **Fase 1**: Grid estático con visualización
2. **Fase 2**: Interacciones básicas (hover, click)
3. **Fase 3**: Drag & drop manual (si es necesario)
4. **Fase 4**: Algoritmos de organización automática

### Ventajas de este Enfoque
- ✅ Modular y escalable
- ✅ Fácil de mantener
- ✅ Performance óptima
- ✅ Responsive y accesible
- ✅ Estilización con TailwindCSS

---

## ❓ Preguntas para Validar

1. **Tamaño del Grid**: ¿10x10 es suficiente o necesitas grids más grandes?
2. **Drag & Drop**: ¿Es crítico o puede ser manual (click origen → click destino)?
3. **Zoom**: ¿Necesitas zoom in/out para anaqueles grandes?
4. **Colores**: ¿Prefieres colores por estado o por clase SGA?
5. **Animaciones**: ¿Qué nivel de animaciones quieres (básico, medio, avanzado)?

---

## 🎨 Paleta de Colores Propuesta

### Tema Claro (Default)
- **Fondo**: `#f9fafb` (Gris muy claro)
- **Celdas vacías**: `#ffffff` (Blanco)
- **Celdas ocupadas**: `#3b82f6` (Azul)
- **Bordes**: `#e5e7eb` (Gris claro)
- **Texto**: `#111827` (Negro)

### Tema Oscuro (Opcional)
- **Fondo**: `#1f2937` (Gris oscuro)
- **Celdas vacías**: `#374151` (Gris medio)
- **Celdas ocupadas**: `#60a5fa` (Azul claro)
- **Bordes**: `#4b5563` (Gris)
- **Texto**: `#f9fafb` (Blanco)

---

## 📋 Checklist de Implementación

### Backend
- [ ] Actualizar tabla `shelves` con grid_width, grid_height, provider
- [ ] Actualizar tabla `dispensed_samples` con width, height
- [ ] Crear API CRUD de anaqueles
- [ ] Crear API de mapa 2D
- [ ] Implementar validaciones de posicionamiento
- [ ] Tests completos

### Frontend
- [ ] Componente `MarketLineSelector`
- [ ] Componente `ShelfSelector`
- [ ] Componente `ShelfCRUD`
- [ ] Componente `ShelfMap2D`
- [ ] Componente `GridCell`
- [ ] Componente `SampleTooltip`
- [ ] Hook `useShelfData`
- [ ] Hook `useGridInteraction`
- [ ] Servicio `warehouseService`
- [ ] Estilos TailwindCSS

---

## ✅ ¿Estás de acuerdo con esta propuesta?

Por favor revisa y dime:
1. ¿Te gusta el flujo de navegación (3 niveles)?
2. ¿El diseño visual es lo que esperas?
3. ¿CSS Grid puro es suficiente o necesitas drag & drop?
4. ¿Algún ajuste o cambio que quieras hacer?

Una vez que apruebes, procederé con la implementación paso a paso, comenzando por el backend y luego el frontend.
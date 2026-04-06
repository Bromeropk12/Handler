# 🎨 REDISEÑO UI/UX - Vista Isométrica 3D del Módulo Almacén

## 📋 PROBLEMAS ACTUALES IDENTIFICADOS

1. **Sidebar muy estrecho** (col-span-2) - Los selectores de Nivel (Y) y Profundidad (Z) están apretados
2. **Canvas 3D sin contexto visual** - No se ven las coordenadas claramente
3. **Navegación confusa** - No es obvio qué nivel/profundidad se está viendo
4. **Sin indicadores visuales de ejes** - El usuario no entiende X, Y, Z fácilmente
5. **Layout desbalanceado** - Mucho espacio vacío o muy apretado

---

## 🎯 NUEVO DISEÑO PROPUESTO

### Layout General (Grid de 12 columnas)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Anaquel BASF #1 | Cosmética | 10×10×10 | 15 muestras  │
├──────────┬──────────────────────────────────────────┬───────────┤
│          │                                          │           │
│ PANEL    │          CANVAS 3D PRINCIPAL             │  PANEL    │
│ IZQUIERDO│                                          │ DERECHO   │
│ (3 cols) │          (6 cols)                        │ (3 cols)  │
│          │                                          │           │
│ • Nivel  │  ┌──────────────────────────────────┐   │ • Stats   │
│   (Y)    │  │                                  │   │ • Filtros │
│   Visual │  │     [Vista 3D Interactiva]       │   │ • Info    │
│   con    │  │                                  │   │   Muestra │
│   preview│  │                                  │   │   Sel.    │
│          │  └──────────────────────────────────┘   │           │
│ • Prof.  │                                          │           │
│   (Z)    │  ┌──────────────────────────────────┐   │ • Herram. │
│   Visual │  │  Barra de Coordenadas: X:3 Y:2 Z:1│   │   Desfrag │
│   con    │  │  Cámara: [Reset] [Top] [Front]    │   │           │
│   preview│  └──────────────────────────────────┘   │           │
│          │                                          │           │
├──────────┴──────────────────────────────────────────┴───────────┤
│  LEYENDA: 🟦 Ocupado  🟨 Alerta  🟥 Vencido  ⬜ Libre          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 COMPONENTES DEL NUEVO DISEÑO

### 1. HEADER MEJORADO
```
┌─────────────────────────────────────────────────────────────────┐
│ 📦 BASF #1  ›  Cosmética  ›  10×10×10  |  15 muestras  |  85%  │
│ [← Volver]                                    [🔄 Actualizar]   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. PANEL IZQUIERDO - Navegación 3D (3 columnas)

#### Selector de Nivel (Y) - Visual
```
┌─────────────────────┐
│  📊 NIVEL (Eje Y)   │
├─────────────────────┤
│  ┌───┐              │
│  │10 │ ○             │ ← Arriba
│  ├───┤              │
│  │ 9 │ ○             │
│  ├───┤              │
│  │ 8 │ ○             │
│  ├───┤              │
│  │ 7 │ ● ◄ Activo   │ ← Highlight
│  ├───┤              │
│  │ 6 │ ○             │
│  ├───┤              │
│  │ 5 │ ○             │
│  ├───┤              │
│  │ 4 │ ○             │
│  ├───┤              │
│  │ 3 │ ○             │
│  ├───┤              │
│  │ 2 │ ○             │
│  ├───┤              │
│  │ 1 │ ○             │
│  └───┘              │
│                     │
│  [↑] [↓] Navegar    │
└─────────────────────┘
```

#### Selector de Profundidad (Z) - Visual
```
┌─────────────────────┐
│  🔍 PROF. (Eje Z)   │
├─────────────────────┤
│                     │
│  Frente             │
│  ┌─┬─┬─┬─┬─┐       │
│  │1│2│3│4│5│       │
│  ├─┼─┼─┼─┼─┤       │
│  │●│○│○│○│○│ ◄ Act │
│  ├─┼─┼─┼─┼─┤       │
│  │6│7│8│9│1│       │
│  └─┴─┴─┴─┴─┘       │
│                     │
│  [←] [→] Navegar    │
│  Fondo              │
└─────────────────────┘
```

### 3. CANVAS 3D CENTRAL (6 columnas)

```
┌─────────────────────────────────────────────────────────┐
│  🎯 Nivel 7 de 10  |  Profundidad 1 de 10  |  Col 10   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [VISTA 3D INTERACTIVA]                     │
│                                                         │
│         • Muestras con colores por estado              │
│         • Grid lines visibles                          │
│         • Ejes etiquetados (X, Y, Z)                   │
│         • Hover muestra tooltip                        │
│         • Click selecciona muestra                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📍 Coordenadas: X:3  Y:7  Z:1  |  📷 Cámara: [⟲] [⬆] [➡]│
└─────────────────────────────────────────────────────────┘
```

### 4. PANEL DERECHO - Info y Herramientas (3 columnas)

#### Estadísticas del Nivel Actual
```
┌─────────────────────┐
│  📈 ESTADÍSTICAS    │
├─────────────────────┤
│  Nivel 7, Prof 1    │
│  ┌───────────────┐  │
│  │ ██████░░░░ 60%│  │
│  └───────────────┘  │
│                     │
│  🟦 6 Ocupadas      │
│  ⬜ 4 Libres        │
│  🟨 1 por vencer    │
│  🟥 0 vencidas      │
└─────────────────────┘
```

#### Muestra Seleccionada
```
┌─────────────────────┐
│  🧪 MUESTRA SEL.    │
├─────────────────────┤
│  Vitamina C         │
│  Lote: VC-2024-001  │
│  Peso: 50g          │
│  SGA: Sin Riesgo    │
│  Vence: 2025-06-15  │
│                     │
│  📍 Pos: X:3 Y:7 Z:1│
│                     │
│  [📋 Ver Detalle]   │
└─────────────────────┘
```

#### Herramientas
```
┌─────────────────────┐
│  🔧 HERRAMIENTAS    │
├─────────────────────┤
│                     │
│  [🔄 Desfragmentar] │
│                     │
│  [📊 Ver Todo 3D]   │
│                     │
│  [📥 Exportar]      │
│                     │
└─────────────────────┘
```

### 5. LEYENDA INFERIOR
```
┌─────────────────────────────────────────────────────────────────┐
│  🟦 Ocupado  🟨 Por vencer (<30d)  🟥 Vencido  ⬜ Libre  ○ Sel │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 MEJORAS CLAVE DE UX

### 1. Navegación Intuitiva
- **Scroll del mouse** cambia de nivel (arriba/abajo)
- **Shift + Scroll** cambia de profundidad
- **Click en celda vacía** muestra "Espacio disponible"
- **Click en muestra** selecciona y muestra info

### 2. Feedback Visual
- **Hover** sobre muestra: resalta + tooltip
- **Click** en muestra: borde brillante + panel info
- **Cambio de nivel**: animación fade
- **Sin muestras**: empty state amigable

### 3. Controles de Cámara
- **Reset**: Vuelve a vista inicial
- **Top**: Vista desde arriba
- **Front**: Vista frontal
- **Auto-rotate**: Rotación automática toggle

### 4. Responsive
- **Desktop completo**: Layout 3-6-3 columnas
- **Tablet**: Layout 2-8-2 columnas
- **Mobile**: Stack vertical con tabs

---

## 📐 ESPECIFICACIONES TÉCNICAS

### Colores
| Estado | Color | Hex |
|--------|-------|-----|
| Ocupado | Azul | `#0ea5e9` |
| Por vencer | Ámbar | `#f59e0b` |
| Vencido | Rojo | `#ef4444` |
| Libre | Gris oscuro | `#374151` |
| Seleccionado | Cyan brillante | `#38bdf8` |
| Hover | Azul claro | `#7dd3fc` |

### Tipografía
- **Títulos**: `font-bold text-sm`
- **Labels**: `font-medium text-xs`
- **Valores**: `font-mono text-xs`
- **Tooltips**: `font-sans text-xs`

### Animaciones
- **Transición de nivel**: `transition-all duration-300`
- **Hover muestra**: `scale-105 duration-200`
- **Selección**: `ring-2 ring-primary-500 duration-200`
- **Empty state**: `animate-fade-in`

---

## 📋 ORDEN DE IMPLEMENTACIÓN

1. **Reestructurar layout** - Grid 3-6-3 columnas
2. **Panel izquierdo** - Selectores visuales de Y y Z
3. **Canvas central** - Mejorar con ejes etiquetados y controles
4. **Panel derecho** - Stats, info muestra, herramientas
5. **Leyenda inferior** - Colores de estado
6. **Navegación por teclado/mouse** - Scroll para niveles
7. **Controles de cámara** - Reset, Top, Front
8. **Responsive** - Tablet y mobile

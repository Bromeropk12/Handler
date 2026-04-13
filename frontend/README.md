# Frontend - Handler TrackSamples

Interfaz de usuario React moderna para el sistema de gestión de muestras químicas.

## 🚀 Inicio Rápido

### Configuración Inicial
```bash
# Instalar dependencias
npm install

# Instalar extensiones recomendadas de VSCode
# Abrir Command Palette (Ctrl+Shift+P) y ejecutar:
# Extensions: Show Recommended Extensions
# Instalar todas las extensiones recomendadas
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm start

# Ejecutar tests
npm test

# Construir para producción
npm run build

# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

### Eliminando Advertencias de TailwindCSS
Si ves advertencias sobre `@tailwind` o `@apply` en VSCode:

1. **Instalar extensiones requeridas:**
   - Tailwind CSS IntelliSense
   - CSS IntelliSense
   - HTML CSS Class Completion

2. **Reiniciar VSCode** después de instalar las extensiones

3. **Verificar configuración:**
   - Abrir Settings (Ctrl+,)
   - Buscar "tailwindCSS.includeLanguages"
   - Asegurar que esté configurado correctamente

Las advertencias desaparecerán automáticamente al tener las extensiones instaladas.

## 🏗️ Arquitectura

### Estructura de Carpetas
```
frontend/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes compartidos
│   │   └── LoadingSpinner.jsx
│   ├── context/            # Context API
│   │   └── AuthContext.jsx
│   ├── hooks/              # Custom hooks
│   │   └── useShelfData.js
│   ├── modules/            # Módulos especializados
│   │   ├── auth/           # Autenticación
│   │   └── warehouse/      # Gestión de almacén
│   │       ├── components/ # Componentes del módulo
│   │       └── WarehousePage.jsx
│   ├── services/           # APIs y servicios
│   │   └── api.js
│   ├── utils/              # Utilidades
│   ├── App.jsx             # Componente raíz
│   ├── index.js            # Punto de entrada
│   └── index.css           # Estilos globales
├── .eslintrc.json          # Configuración ESLint
├── .prettierrc             # Configuración Prettier
└── tailwind.config.js      # Configuración TailwindCSS
```

## 🎨 Diseño y Estilos

### TailwindCSS Personalizado
- **Paleta de colores distintiva** para Handler TrackSamples
- **Componentes base** predefinidos (`btn-primary`, `card`, etc.)
- **Animaciones personalizadas** (`fade-in`, `slide-up`, etc.)
- **Estados SGA** con colores específicos
- **Tema responsive** completo

### Patrones de Diseño
- **Context API** para estado global (autenticación)
- **Custom Hooks** para lógica compleja (`useShelfData`)
- **Componentes modulares** con responsabilidades claras
- **Props drilling evitado** con composición inteligente

## 🔧 Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm start          # Inicia servidor en http://localhost:3000
npm test           # Ejecuta tests en modo interactivo
npm run build      # Construye para producción
npm run eject      # Expulsa configuración (irreversible)

# Calidad de código
npm run lint       # Ejecuta ESLint
npm run format     # Formatea con Prettier
```

### Variables de Entorno

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### Extensiones VSCode Recomendadas

- **ESLint**: Linting de código
- **Prettier**: Formateo automático
- **Tailwind CSS IntelliSense**: Autocompletado de clases
- **Auto Rename Tag**: Renombrado automático de tags
- **Path Intellisense**: Autocompletado de rutas

## 🔐 Autenticación

### Context API
```jsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  // Uso del contexto
}
```

### Protección de Rutas
```jsx
import { useAuth } from './context/AuthContext';

function ProtectedComponent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Contenido protegido</div>;
}
```

## 📡 APIs

### Cliente Axios Configurado
```javascript
import { warehouseAPI } from './services/api';

// Ejemplo de uso
const shelves = await warehouseAPI.getShelves();
const shelfMap = await warehouseAPI.getShelfMap(shelfId);
```

### Interfaz Tipada
- **authAPI**: Autenticación y usuarios
- **samplesAPI**: Gestión de muestras globales
- **warehouseAPI**: Operaciones de almacén
- **dispensingAPI**: Dispensación de muestras
- **dispatchAPI**: Despachos
- **movementsAPI**: Trazabilidad

## 🧪 Testing

### Configuración Jest + React Testing Library
```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Cobertura de Tests
- Componentes principales
- Custom hooks
- Lógica de negocio
- Interacciones de usuario

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Grid Responsivo
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Contenido responsive */}
</div>
```

## 🎭 Animaciones y Transiciones

### Clases de Animación
- `animate-fade-in`: Entrada suave
- `animate-slide-up`: Deslizamiento hacia arriba
- `animate-scale-in`: Escalado de entrada
- `animate-pulse-slow`: Pulso lento

### Ejemplo de Uso
```jsx
<div className="animate-fade-in">
  Contenido con animación
</div>
```

## 🚀 Performance

### Optimizaciones Implementadas
- **Lazy loading** de componentes
- **Memoización** con `useMemo` y `useCallback`
- **Virtualización** preparada para grids grandes
- **Bundle splitting** automático de React

### Mejores Prácticas
- Componentes funcionales con hooks
- Props destructuring
- Callbacks estables
- Evitar re-renders innecesarios

## 🔧 Configuración de Desarrollo

### VSCode Settings
- Formateo automático al guardar
- ESLint automático
- Tailwind IntelliSense
- Emmet para JSX

### Extensiones Recomendadas
- Prettier
- ESLint
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Path Intellisense

## 📋 Checklist de Desarrollo

### Antes de Commit
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run format` ejecutado
- [ ] Tests pasan (`npm test`)
- [ ] Build de producción funciona (`npm run build`)

### Code Review
- [ ] Nombres descriptivos de variables/funciones
- [ ] Componentes pequeños y reutilizables
- [ ] Props bien tipadas (cuando se use TypeScript)
- [ ] Comentarios en lógica compleja
- [ ] Tests incluidos para nuevas funcionalidades

## 🐛 Troubleshooting

### Problemas Comunes

**Error de CORS**
```
Solución: Verificar REACT_APP_API_URL en .env
```

**Tailwind classes no aplican**
```
Solución: Reiniciar servidor de desarrollo
```

**ESLint errors**
```
Solución: npm run lint para ver detalles
```

## 📞 Soporte

Para soporte técnico contactar al equipo de desarrollo de Handler S.A.S.
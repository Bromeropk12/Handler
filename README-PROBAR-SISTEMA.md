# 🚀 Guía Completa para Probar Handler TrackSamples

## 📋 Requisitos Previos

### Software Necesario
- **Node.js** v18+ (recomendado v20)
- **pnpm** (gestor de paquetes)
- **Docker** y **Docker Compose**
- **Git**

### Verificación de Instalación
```bash
# Verificar Node.js
node --version  # Debe ser v18 o superior

# Verificar pnpm
pnpm --version  # Debe estar instalado

# Verificar Docker
docker --version
docker-compose --version
```

---

## 🎯 PASO 1: Configuración Inicial (MÉTODO AUTOMÁTICO)

### 🚀 **Método Ultra-Simple (Recomendado)**
```bash
# Solo ejecuta este archivo y todo se hace automáticamente:
iniciar-sistema.bat
```

**¿Qué hace el script automáticamente?**
- ✅ Valida e Instala dependencias globales (`pnpm`, `concurrently`)
- ✅ Instala dependencias del workspace macro completo
- ✅ Levanta PostgreSQL con Docker (`docker-compose up`)
- ✅ Inicia backend (puerto 3001) y frontend (puerto 3000)
- ✅ Concentra todos los procesos en un solo lugar.

### 🔧 **Método Manual (Si prefieres paso a paso)**
```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm

# Verificar instalación
pnpm --version
```

### 🛑 **Para Detener Todo**
- Todo corre en una sola consola unificada, orquestado por el paquete de Node `concurrently`. 
- **Para apagar todo el sistema ordenadamente:** Simplemente ve a la consola donde está corriendo y presiona `Ctrl + C`. Las bases de datos en Docker y ambos servidores locales (front y back) se apagarán con seguridad en cadena.

---

## 🗄️ PASO 2: Levantar Base de Datos PostgreSQL

### 2.1 Iniciar PostgreSQL con Docker
```bash
# Navegar al directorio de la base de datos
cd database

# Levantar PostgreSQL
docker compose up -d

# Verificar que está corriendo
docker compose ps
```

**Salida esperada:**
```
Name                    Command               State                    Ports
database-postgres-1   docker-entrypoint.sh postgres    Up      0.0.0.0:5432->5432/tcp
```

### 2.2 Verificar Conexión a BD
```bash
# Conectar a PostgreSQL para verificar
docker exec -it database-postgres-1 psql -U handler_user -d handler_tracksamples

# Dentro de PostgreSQL, ejecutar:
\d  # Debe mostrar las tablas creadas
\q  # Salir
```

---

## 🔧 PASO 3: Configurar y Ejecutar Backend

### 3.1 Instalar Dependencias del Backend
```bash
# Navegar al directorio backend
cd ../backend

# Instalar dependencias
pnpm install
```

### 3.2 Configurar Variables de Entorno
```bash
# El archivo .env ya está configurado correctamente
# Verificar contenido (opcional)
cat .env
```

### 3.3 Ejecutar Tests del Backend
```bash
# Ejecutar todos los tests
pnpm run test

# Salida esperada: 11 tests pasando ✅
```

### 3.4 Iniciar Servidor Backend
```bash
# Iniciar el servidor
pnpm start

# O en modo desarrollo (recomendado)
pnpm run dev
```

**Salida esperada:**
```
info: Handler TrackSamples Backend corriendo en puerto 3001
info: Environment: development
info: Database connected successfully
```

### 3.5 Verificar APIs del Backend
```bash
# Verificar que el backend responde
curl http://localhost:3001/api/health

# Debe responder: {"status":"ok","message":"Handler TrackSamples API"}
```

---

## 🎨 PASO 4: Configurar y Ejecutar Frontend

### 4.1 Instalar Dependencias del Frontend
```bash
# Navegar al directorio frontend
cd ../frontend

# Instalar dependencias
npm install
```

### 4.2 Configurar VSCode (Opcional pero Recomendado)
```bash
# Abrir VSCode en el directorio frontend
code .

# Instalar extensiones recomendadas:
# - Tailwind CSS IntelliSense
# - ESLint
# - Prettier
```

### 4.3 Iniciar Servidor Frontend
```bash
# Iniciar el servidor de desarrollo
npm start
```

**Salida esperada:**
```
Compiled successfully!
You can now view handler-tracksamples-frontend in the browser.
Local:            http://localhost:3000
```

---

## 🧪 PASO 5: Probar el Sistema Completo

### 5.1 Acceder al Sistema
```
Abrir navegador en: http://localhost:3000
```

### 5.2 Flujo de Prueba Completo

#### **Paso 1: Login**
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Resultado:** Acceso al sistema principal

#### **Paso 2: Seleccionar Línea de Mercado**
- Ver 3 cards con líneas: Cosmética, Farmacéutica, Industrial
- Cada card muestra estadísticas y descripción
- **Seleccionar:** Cualquier línea (ej: "Cosmética")

#### **Paso 3: Seleccionar Anaquel**
- Ver lista de anaqueles de la línea seleccionada
- Cada anaquel muestra: capacidad, ocupación, alertas
- **Seleccionar:** Cualquier anaquel disponible

#### **Paso 4: Explorar Mapa 2D**
- Ver grid interactivo del anaquel
- **Funcionalidades a probar:**
  - Hover sobre celdas → tooltip con información
  - Click en celdas ocupadas → panel de detalles
  - Filtros: "Mostrar vencidas", "Mostrar alertas"
  - Estados visuales: vacío, ocupado, warning, expired

#### **Paso 5: Verificar Algoritmos SGA**
- Las celdas ocupadas tienen colores según clase SGA:
  - 🟢 Verde: Sin Riesgo
  - 🟠 Naranja: Inflamable
  - 🟡 Amarillo: Corrosivo
  - 🔴 Rojo: Tóxico

### 5.3 Funcionalidades Adicionales a Probar

#### **Navegación Jerárquica**
- Botón "Volver" en cada nivel
- Breadcrumb visible
- Transiciones suaves entre niveles

#### **Estados de Carga**
- Spinners en operaciones
- Mensajes informativos
- Estados de error manejados

#### **Responsive Design**
- Probar en móvil/tablet/desktop
- Layouts adaptativos
- Touch interactions

---

## 🔍 PASO 6: Verificación de Funcionalidades Técnicas

### 6.1 Verificar Backend APIs
```bash
# Probar endpoints principales
curl http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
curl http://localhost:3001/api/samples/market-lines
curl http://localhost:3001/api/warehouse?shelf_id=1
```

### 6.2 Verificar Base de Datos
```bash
# Conectar a PostgreSQL
docker exec -it database-postgres-1 psql -U handler_user -d handler_tracksamples

# Verificar datos
SELECT * FROM users;
SELECT * FROM market_lines;
SELECT * FROM shelves LIMIT 5;
SELECT * FROM global_samples LIMIT 5;
SELECT * FROM dispensed_samples LIMIT 5;
```

### 6.3 Verificar Logs del Sistema
```bash
# Ver logs del backend
cd ../backend
tail -f logs/combined.log

# Ver logs de la base de datos
cd ../database
docker compose logs -f postgres
```

---

## 🐛 PASO 7: Troubleshooting

### Problemas Comunes y Soluciones

#### **Error: Puerto 3000/3001 ocupado**
```bash
# Matar procesos en puertos
npx kill-port 3000 3001

# O cambiar puertos en configuración
```

#### **Error: PostgreSQL no conecta**
```bash
# Reiniciar base de datos
cd database
docker compose down
docker compose up -d

# Verificar variables de entorno en backend/.env
```

#### **Error: Dependencias no instaladas**
```bash
# Limpiar y reinstalar
cd backend && rm -rf node_modules && pnpm install
cd ../frontend && rm -rf node_modules && npm install
```

#### **Error: Tests fallan**
```bash
# Verificar que PostgreSQL esté corriendo
cd database && docker compose ps

# Ejecutar tests individualmente
cd ../backend
pnpm test -- --testNamePattern="auth"
```

#### **Error: Frontend no carga estilos**
```bash
# Verificar que TailwindCSS esté procesando
cd frontend
npm run build

# Revisar configuración de PostCSS
cat postcss.config.js
```

---

## 📊 PASO 8: Métricas de Verificación

### Checklist de Prueba Completa

#### **Backend (95% Completado)**
- ✅ PostgreSQL corriendo en Docker
- ✅ APIs respondiendo correctamente
- ✅ Autenticación JWT funcionando
- ✅ 11 tests pasando
- ✅ Sistema SGA implementado
- ✅ Algoritmos de compatibilidad química

#### **Frontend (95% Completado)**
- ✅ React + TailwindCSS funcionando
- ✅ Navegación jerárquica completa
- ✅ Mapa 2D interactivo funcional
- ✅ Estados visuales SGA correctos
- ✅ Responsive design
- ✅ Código 100% limpio (0 warnings)

#### **Integración Completa**
- ✅ Backend ↔ Frontend comunicación
- ✅ Base de datos ↔ Backend integración
- ✅ APIs RESTful funcionales
- ✅ Autenticación end-to-end
- ✅ Estado global manejado correctamente

---

## 🎯 Próximos Pasos Opcionales

Si el sistema funciona correctamente, puedes considerar:

1. **Tema Claro/Oscuro**: Implementar switch de tema
2. **Tests E2E**: Cypress o Playwright para pruebas completas
3. **Empaquetado Tauri**: Convertir a aplicación de escritorio
4. **Docker Compose Completo**: Backend + Frontend + BD juntos
5. **CI/CD**: GitHub Actions para deployment automático

---

## 📞 Soporte

Si encuentras problemas durante la instalación o pruebas:

1. **Verificar logs** de cada componente
2. **Revisar puertos** y conexiones
3. **Verificar dependencias** instaladas correctamente
4. **Contactar equipo de desarrollo** para soporte específico

---

## ✅ Resumen Ejecutivo

**Estado del Sistema:** 🚀 **95% Completado y Funcional**

- **Backend:** APIs completas, algoritmos SGA, testing exhaustivo
- **Frontend:** UI moderna, mapa 2D interactivo, navegación completa
- **Base de Datos:** PostgreSQL con schemas validados
- **Integración:** Sistema completamente funcional end-to-end
- **Calidad:** Código limpio, documentado, mantenible

**Tiempo estimado de prueba:** 15-20 minutos
**Complejidad:** Baja (seguir pasos secuenciales)
**Resultado esperado:** Sistema Handler TrackSamples completamente operativo
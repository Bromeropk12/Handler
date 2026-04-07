# 🔧 Configuración de Red Local - Handler TrackSamples

## 📋 REQUISITOS PREVIOS

- Computador del Admin con IP fija en la red local
- Docker Desktop corriendo en el computador del Admin
- Puertos 3000, 3001, 5432 abiertos en el Firewall de Windows
- Todos los computadores en la misma red local (misma subred)

---

## 🖥️ PASO 1: Configurar IP Fija en el Computador del Admin

1. Abrir **Configuración de Windows** → **Red e Internet** → **Ethernet**
2. Hacer clic en la conexión de red → **Editar asignación de IP**
3. Seleccionar **Manual** → Activar **IPv4**
4. Configurar:
   - **Dirección IP**: `192.168.1.100` (o la que corresponda a tu red)
   - **Máscara de subred**: `255.255.255.0`
   - **Puerta de enlace**: `192.168.1.1`
   - **DNS preferido**: `8.8.8.8`

---

## 🔥 PASO 2: Abrir Puertos en el Firewall de Windows

Ejecutar como **Administrador** en PowerShell:

```powershell
# Puerto del Backend (API)
New-NetFirewallRule -DisplayName "Handler TrackSamples Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Puerto de la Base de Datos (PostgreSQL)
New-NetFirewallRule -DisplayName "Handler TrackSamples DB" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow

# Puerto del Frontend (React)
New-NetFirewallRule -DisplayName "Handler TrackSamples Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## ⚙️ PASO 3: Configurar Backend para Red Local

### 3.1 Editar `backend/.env`

```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
HOST=0.0.0.0

# Allowed Origins (agregar las IPs de los usuarios en la red)
ALLOWED_ORIGINS=http://192.168.1.101:3000,http://192.168.1.102:3000,http://192.168.1.103:3000
```

### 3.2 Configurar Docker para PostgreSQL

Editar `database/docker-compose.yml`:

```yaml
services:
  db:
    ports:
      - "0.0.0.0:5432:5432"  # Escuchar en todas las interfaces
```

---

## 🌐 PASO 4: Configurar Frontend en los Computadores de Usuarios

### 4.1 Crear archivo `.env` en el frontend

```env
REACT_APP_API_URL=http://192.168.1.100:3001/api
```

Donde `192.168.1.100` es la IP del computador del Admin.

### 4.2 Iniciar el frontend

```bash
cd frontend
npm start
```

---

## 📡 PASO 5: Verificar Conectividad

### Desde un computador de usuario:

```powershell
# Verificar que puede alcanzar el backend
curl http://192.168.1.100:3001/health

# Verificar que puede alcanzar la BD
Test-NetConnection -ComputerName 192.168.1.100 -Port 5432
```

### Resultado esperado:

```json
{
  "status": "OK",
  "timestamp": "2026-04-06T...",
  "service": "Handler TrackSamples Backend",
  "version": "1.0.0"
}
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Origen no permitido por CORS"
- Agregar la IP del usuario a `ALLOWED_ORIGINS` en `backend/.env`
- Reiniciar el backend

### Error: "Connection refused"
- Verificar que el backend está corriendo en el Admin
- Verificar que el Firewall permite el puerto 3001

### Error: "Network is unreachable"
- Verificar que todos los computadores están en la misma red
- Verificar la configuración de IP del Admin

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [ ] IP fija configurada en el Admin
- [ ] Puertos abiertos en el Firewall
- [ ] `backend/.env` con `HOST=0.0.0.0` y `ALLOWED_ORIGINS`
- [ ] Docker configurado para escuchar en `0.0.0.0`
- [ ] Frontend de usuarios con `REACT_APP_API_URL` correcto
- [ ] Conectividad verificada desde los computadores de usuarios
- [ ] Sistema funcionando con hasta 5 usuarios simultáneos
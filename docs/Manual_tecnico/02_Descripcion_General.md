# 2. DESCRIPCIÓN GENERAL DEL SISTEMA

**Handler TrackSamples** es un aplicativo de escritorio (Desktop App) de arquitectura Cliente-Servidor local (SPA + API REST). El sistema completo se distribuye a través de un único instalador ejecutable (`.exe`) que configura y orquesta automáticamente todos los componentes necesarios en la máquina del usuario.

### Arquitectura y Stack Tecnológico

El sistema se compone de tres capas principales altamente desacopladas:

1.  **Capa de Presentación (Frontend / UI):**
    *   **Core:** Desarrollado en React 18, garantizando reactividad y alto rendimiento.
    *   **Estilos:** Utiliza TailwindCSS para un diseño fluido y modular.
    *   **Motor Gráfico Espacial:** Emplea React Three Fiber y Drei (basado en Three.js) para renderizar mapas 3D interactivos de la bodega y los anaqueles.
    *   **Gestión de Estado y Enrutamiento:** Zustand y React Router DOM.
    *   **Empaquetado y Distribución:** Electron, operando como aplicación de escritorio compilada e instalada nativamente en Windows (`.exe`).

2.  **Capa de Lógica de Negocio (Backend / API):**
    *   **Runtime:** Node.js (v18+) con el framework Express.
    *   **Seguridad:** Endpoints protegidos con JSON Web Tokens (JWT), encriptación bcryptjs y políticas anti-DDoS (express-rate-limit).
    *   **Validación de Datos:** Uso estricto de esquemas Joi.
    *   **Registro y Trazabilidad:** Sistema robusto de logging mediante Winston, registrando todo evento crítico del sistema.

3.  **Capa de Persistencia (Base de Datos Local):**
    *   **Motor:** PostgreSQL 15 ejecutándose **absoluta y totalmente en local** gracias a Docker. El instalador configura el motor SQL sin necesidad de servidores externos en la nube.
    *   **Aislamiento y Seguridad:** La base de datos es el pilar de la seguridad del aplicativo, implementando políticas **RLS (Row Level Security)** nativas para restringir el acceso a datos según el rol de cada usuario a nivel de motor SQL.

### Módulos Principales del Código
*   **Módulo de Inventario (Global y Dispensación):** Algoritmos que controlan divisiones de peso, validaciones FEFO y vinculación de Certificados de Análisis (CoA).
*   **Módulo SGA:** Lógica en backend y frontend para evaluar cruces de materiales peligrosos e impedir ubicaciones inseguras.
*   **Módulo Espacial:** Cálculos volumétricos y renderizado en lienzo HTML5/WebGL de los contenedores y frascos.

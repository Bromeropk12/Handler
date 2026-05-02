@echo off
chcp 850 >nul 2>&1
title Handler TrackSamples

echo.
echo =======================================================
echo      Handler TrackSamples Desktop App
echo      Sistema de Gestion de Muestras Quimicas
echo      Base de Datos: Supabase Cloud (Production)
echo =======================================================
echo.

:: ── [1/4] Verificar Node.js ─────────────────────────────────────────────────
echo [1/4] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargalo en: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo Node.js %%v detectado

:: ── [2/4] Verificar pnpm ────────────────────────────────────────────────────
echo.
echo [2/4] Verificando pnpm...
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Instalando pnpm globalmente...
    call npm install -g pnpm
)
for /f "tokens=*" %%v in ('pnpm --version') do echo pnpm v%%v detectado

:: ── [3/4] Instalar dependencias ─────────────────────────────────────────────
echo.
echo [3/4] Instalando dependencias del Backend...
cd /d "%~dp0backend"
call pnpm install
cd /d "%~dp0"

echo.
echo [3/4] Instalando dependencias del Frontend...
cd /d "%~dp0frontend"
call npm install
cd /d "%~dp0"

:: ── [4/4] Iniciar sistema ────────────────────────────────────────────────────
echo.
echo [4/4] Iniciando Handler TrackSamples...
echo Conectando a Supabase Cloud...
echo Presiona Ctrl+C para detener todo.
echo.

call npm run start:full

echo.
echo Sistema detenido.
pause
@echo off
chcp 850 >nul 2>&1
title Handler TrackSamples

echo.
echo =======================================================
echo      Handler TrackSamples Desktop App
echo      Sistema de Gestion de Muestras Quimicas
echo =======================================================
echo.

echo [1/5] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargalo en: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo Node.js %%v detectado

echo.
echo [2/5] Verificando pnpm...
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Instalando pnpm globalmente...
    call npm install -g pnpm
)
for /f "tokens=*" %%v in ('pnpm --version') do echo pnpm v%%v detectado

echo.
echo [3/5] Instalando dependencias del Backend...
cd /d "%~dp0backend"
call pnpm install
cd /d "%~dp0"

echo.
echo [4/5] Instalando dependencias del Frontend...
cd /d "%~dp0frontend"
call npm install
cd /d "%~dp0"

echo.
echo [5/5] Verificando Docker...
set DOCKER_AVAILABLE=0
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto no_docker

docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto docker_not_running

set DOCKER_AVAILABLE=1
echo Docker esta corriendo correctamente.
goto launch

:docker_not_running
echo Docker instalado pero NO esta corriendo.
echo Abre Docker Desktop manualmente (icono de ballena en la barra de tareas).
echo.
echo Cuando Docker este listo (icono verde), presiona una tecla para continuar...
pause >nul
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set DOCKER_AVAILABLE=1
    goto launch
)
echo Docker sigue sin responder. Iniciando sin base de datos.
goto launch

:no_docker
echo [ERROR] Docker no esta instalado.
echo Instala Docker Desktop: https://www.docker.com/products/docker-desktop/
echo Continuando sin base de datos local (login no funcionara).
goto launch

:launch
echo.
if "%DOCKER_AVAILABLE%"=="1" (
    echo Iniciando con Base de Datos + Backend + Electron...
    echo Presiona Ctrl+C para detener todo.
    echo.
    call npm run start:full
) else (
    echo ADVERTENCIA: Sin base de datos. El login no funcionara.
    echo Presiona Ctrl+C para detener todo.
    echo.
    call npm run start:no-db
)

echo.
echo Sistema detenido.
pause
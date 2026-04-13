# ============================================
# Händler TrackSamples - Script de Inicio
# ============================================
# Ejecuta backend y frontend automáticamente
# Puerto Backend: 3000
# Puerto Frontend: 8000
# ============================================

$ErrorActionPreference = "Stop"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Händler TrackSamples - Iniciando..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

if (-not (Test-Path $backendPath)) {
    Write-Host "[ERROR] No se encontro la carpeta backend" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "[ERROR] No se encontro la carpeta frontend" -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] Iniciando Backend (Puerto 3000)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$backendPath'
Write-Host 'Backend iniciandose en http://localhost:3000' -ForegroundColor Green
node src/index.js
"@ -WindowStyle Normal

Write-Host "[2/2] Iniciando Frontend (Puerto 8000)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$frontendPath'
Write-Host 'Frontend iniciandose en http://localhost:8000' -ForegroundColor Green
pnpm dev
"@ -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servicios iniciados correctamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host " Cierra las ventanas para detener los servicios" -ForegroundColor Gray
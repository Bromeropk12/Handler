!include LogicLib.nsh

!macro customInstall
  DetailPrint "Detectando motor de base de datos PostgreSQL..."
  nsExec::ExecToStack 'powershell -NoProfile -Command "Get-Service -Name postgresql*"'
  Pop $0
  Pop $1

  ${If} $0 == 0
    DetailPrint "PostgreSQL detectado. Omitiendo instalacion."
  ${Else}
    DetailPrint "PostgreSQL no detectado. Instalando con winget (puerto 5432)..."
    ; --override pasa argumentos al instalador EDB interno de PostgreSQL.
    ; El password del superusuario 'postgres' NO se hardcodea: el instalador EDB
    ; permite dejar el password en blanco y el setup wizard de la app lo
    ; solicita al usuario en la primera ejecucion (ver setup_page.html).
    ; port fija el puerto de escucha (evita el default 5432 si esta ocupado).
    ;
    ; IMPORTANTE: en una instalacion multi-tenant o expuesta a LAN, el operador
    ; DEBE rotar este password inmediatamente despues de la instalacion.
    ; Documentado en Manual_Tecnico_Completo.md, seccion 4.2.2 (C4).
    nsExec::ExecToStack 'powershell -NoProfile -Command "winget install --id PostgreSQL.PostgreSQL --silent --accept-source-agreements --accept-package-agreements --override \""/port=5432\"" "'
    Pop $2
    Pop $3
    ${If} $2 != 0
      DetailPrint "AVISO: winget finalizo con codigo $2. Continuando con setup wizard para configuracion manual."
    ${Else}
      DetailPrint "winget finalizo con exito. Esperando a que el servicio PostgreSQL este Running (max 90s)..."
      ; Espera bloqueante hasta que el servicio postgresql-x64-* llegue a Running o timeout.
      ; WaitForStatus es metodo nativo de ServiceController en .NET.
      ; En NSIS, $$ escapa a $ literal para que PowerShell reciba $$_ como $_.
      nsExec::ExecToStack 'powershell -NoProfile -Command "Get-Service -Name postgresql* -ErrorAction SilentlyContinue | ForEach-Object { $$_.WaitForStatus(''Running'', ''00:01:30''); if ($$_.Status -eq ''Running'') { exit 0 } else { exit 3 } }"'
      Pop $4
      Pop $5
      ${If} $4 == 0
        DetailPrint "PostgreSQL en estado Running. Continuando instalacion..."
      ${Else}
        DetailPrint "AVISO: PostgreSQL no llego a Running tras 90s (codigo $4). El setup wizard pedira configuracion."
      ${EndIf}
    ${EndIf}
  ${EndIf}

  DetailPrint "Configurando servicio de Windows HandlerTrackSamples..."
  nsExec::ExecToLog '"$INSTDIR\resources\backend\nssm.exe" install HandlerTrackSamples "$INSTDIR\resources\backend\backend.exe"'
  nsExec::ExecToLog '"$INSTDIR\resources\backend\nssm.exe" set HandlerTrackSamples AppDirectory "$INSTDIR\resources\backend"'
  nsExec::ExecToLog '"$INSTDIR\resources\backend\nssm.exe" set HandlerTrackSamples AppEnvironmentExtra "NODE_ENV=production" "PORT=3001"'
  nsExec::ExecToLog '"$INSTDIR\resources\backend\nssm.exe" set HandlerTrackSamples Start SERVICE_AUTO_START'
  nsExec::ExecToLog '"$INSTDIR\resources\backend\nssm.exe" start HandlerTrackSamples'

  DetailPrint "Configurando Firewall de Windows..."
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="HandlerTrackSamples" dir=in action=allow protocol=TCP localport=3001 profile=private,public'
!macroend

!macro customUnInstall
  DetailPrint "Deteniendo y removiendo servicio de Windows HandlerTrackSamples..."
  nsExec::ExecToLog '"$INSTDIR\resources\backend\nssm.exe" stop HandlerTrackSamples'
  nsExec::ExecToLog '"$INSTDIR\resources\backend\nssm.exe" remove HandlerTrackSamples confirm'

  DetailPrint "Removiendo reglas del Firewall..."
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="HandlerTrackSamples"'
!macroend

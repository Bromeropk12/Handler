(function() {
  'use strict';

  let currentProtocol = 'http';
  let currentPort = 3001;

  function init() {
    updateStatus();
    loadNetwork();
    loadLogs();
    loadSseCount();

    setInterval(updateStatus, 5000);
    setInterval(loadLogs, 5000);
    setInterval(loadSseCount, 5000);

    document.getElementById('btnStart').addEventListener('click', function() { triggerAction('start'); });
    document.getElementById('btnStop').addEventListener('click', function() { triggerAction('stop'); });
    document.getElementById('btnRestart').addEventListener('click', function() { triggerAction('restart'); });
    document.getElementById('btnNotifyRestart').addEventListener('click', sendRestartNotif);
    document.getElementById('btnNotifyUpdate').addEventListener('click', sendUpdateNotif);

    const refreshLogsBtn = document.querySelector('.log-header .btn-icon-only');
    if (refreshLogsBtn) {
      refreshLogsBtn.addEventListener('click', loadLogs);
    }
  }

  async function updateStatus() {
    try {
      const status = await window.electronAPI.getServiceStatus();
      const badge = document.getElementById('statusBadge');
      const text = document.getElementById('statusText');
      const btnStart = document.getElementById('btnStart');
      const btnStop = document.getElementById('btnStop');
      const btnRestart = document.getElementById('btnRestart');

      badge.className = 'status-badge';
      btnStart.disabled = false;
      btnStop.disabled = false;
      btnRestart.disabled = false;

      if (status === 'RUNNING') {
        badge.classList.add('status-running');
        text.textContent = 'En ejecución (LAN)';
        btnStart.disabled = true;
      } else if (status === 'STOPPED') {
        badge.classList.add('status-stopped');
        text.textContent = 'Detenido';
        btnStop.disabled = true;
        btnRestart.disabled = true;
      } else if (status === 'STARTING') {
        badge.classList.add('status-pending');
        text.textContent = 'Iniciando...';
        btnStart.disabled = true;
        btnStop.disabled = true;
        btnRestart.disabled = true;
      } else if (status === 'STOPPING') {
        badge.classList.add('status-pending');
        text.textContent = 'Deteniendo...';
        btnStart.disabled = true;
        btnStop.disabled = true;
        btnRestart.disabled = true;
      } else if (status === 'NOT_INSTALLED') {
        badge.classList.add('status-not_installed');
        text.textContent = 'No Instalado';
        btnStart.disabled = true;
        btnStop.disabled = true;
        btnRestart.disabled = true;
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  }

  async function triggerAction(action) {
    const alertEl = document.getElementById('msgAlert');
    alertEl.style.display = 'none';

    try {
      const res = await window.electronAPI.controlService(action);
      if (res && !res.success) {
        alertEl.className = 'alert alert-error';
        alertEl.textContent = '❌ Error: ' + res.error;
        alertEl.style.display = 'block';
        setTimeout(function() { alertEl.style.display = 'none'; }, 6000);
      } else {
        if (res && res.warning) {
          alertEl.className = 'alert alert-success';
          alertEl.textContent = 'ℹ️ ' + res.warning;
          alertEl.style.display = 'block';
          setTimeout(function() { alertEl.style.display = 'none'; }, 4000);
        }
        await updateStatus();
        setTimeout(loadLogs, 1500);
      }
    } catch (err) {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = '❌ Error de comunicación: ' + err.message;
      alertEl.style.display = 'block';
      setTimeout(function() { alertEl.style.display = 'none'; }, 6000);
    }
  }

  async function loadNetwork() {
    try {
      const info = await window.electronAPI.getNetworkInfo();
      const list = document.getElementById('networkList');
      list.innerHTML = '';

      currentProtocol = info.protocol || 'https';
      currentPort = info.port || 3001;

      addNetworkItem('Local', currentProtocol + '://localhost:' + currentPort);

      let firstLanUrl = '';
      if (info.addresses && info.addresses.length > 0) {
        info.addresses.forEach(function(addr) {
          const url = currentProtocol + '://' + addr.ip + ':' + currentPort;
          if (!firstLanUrl) firstLanUrl = url;
          addNetworkItem(addr.interface, url);
        });
      }

      const qrUrl = firstLanUrl || (currentProtocol + '://localhost:' + currentPort);
      const qrImg = document.getElementById('qrImage');
      qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + encodeURIComponent(qrUrl);
    } catch (err) {
      console.error('Error cargando red:', err);
    }
  }

  function addNetworkItem(name, url) {
    const list = document.getElementById('networkList');
    const item = document.createElement('div');
    item.className = 'network-item';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'network-info';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'network-label';
    labelSpan.textContent = name;

    const ipSpan = document.createElement('span');
    ipSpan.className = 'network-ip';
    ipSpan.style.cursor = 'pointer';
    ipSpan.style.color = '#10b981';
    ipSpan.textContent = url;
    ipSpan.addEventListener('click', function() { openBrowser(url); });

    infoDiv.appendChild(labelSpan);
    infoDiv.appendChild(ipSpan);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-icon-only';
    copyBtn.textContent = '📋 Copiar';
    copyBtn.addEventListener('click', function() { copyText(url); });

    item.appendChild(infoDiv);
    item.appendChild(copyBtn);
    list.appendChild(item);
  }

  function openBrowser(url) {
    window.electronAPI.openExternalBrowser(url);
  }

  async function loadLogs() {
    try {
      const logs = await window.electronAPI.getLatestLogs();
      const consoleEl = document.getElementById('logConsole');
      consoleEl.textContent = logs || 'Sin registros.';
      consoleEl.scrollTop = consoleEl.scrollHeight;
    } catch (err) {
      console.error('Error cargando logs:', err);
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
    const alert = document.getElementById('msgAlert');
    alert.className = 'alert alert-success';
    alert.textContent = '✓ Enlace copiado al portapapeles: ' + text;
    alert.style.display = 'block';
    setTimeout(function() {
      alert.style.display = 'none';
    }, 3000);
  }

  async function loadSseCount() {
    try {
      var result = await window.electronAPI.getSseClientCount();
      document.getElementById('sseCountNum').textContent = result.count;
    } catch (_) {
      document.getElementById('sseCountNum').textContent = '?';
    }
  }

  async function sendRestartNotif() {
    const btn = document.getElementById('btnNotifyRestart');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      const res = await window.electronAPI.notifyRestart(2);
      showMsg(res && res.success
        ? '✅ Notificación enviada a ' + (res.clients ?? '?') + ' cliente(s).'
        : '❌ No se pudo enviar (¿servicio detenido?)', res && res.success);
    } catch (err) {
      showMsg('❌ Error: ' + err.message, false);
    } finally {
      btn.disabled = false;
      btn.textContent = '⚠️ Avisar Reinicio (2 min)';
    }
  }

  async function sendUpdateNotif() {
    const version = document.getElementById('versionInput').value.trim() || 'nueva';
    const btn = document.getElementById('btnNotifyUpdate');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      const res = await window.electronAPI.notifyUpdate(version);
      showMsg(res && res.success
        ? '✅ Notificación de actualización enviada a ' + (res.clients ?? '?') + ' cliente(s).'
        : '❌ No se pudo enviar (¿servicio detenido?)', res && res.success);
    } catch (err) {
      showMsg('❌ Error: ' + err.message, false);
    } finally {
      btn.disabled = false;
      btn.textContent = '🔄 Notif. Update';
    }
  }

  function showMsg(text, isSuccess) {
    const alertEl = document.getElementById('msgAlert');
    alertEl.className = 'alert ' + (isSuccess ? 'alert-success' : 'alert-error');
    alertEl.textContent = text;
    alertEl.style.display = 'block';
    setTimeout(function() { alertEl.style.display = 'none'; }, 4000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();

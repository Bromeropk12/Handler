import React, { useState, useEffect } from 'react';

const NetworkInfoWidget = () => {
  const [ips, setIps] = useState([]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getNetworkInfo) {
      window.electronAPI.getNetworkInfo()
        .then(data => setIps(data))
        .catch(err => console.error('Error fetching IPs:', err));
    }
  }, []);

  if (!ips || ips.length === 0) return null;

  return (
    <div className="card bg-blue-500/10 border-blue-500/30 text-blue-100 p-4">
      <div className="flex items-center gap-3 mb-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <h3 className="font-bold text-sm text-blue-200">Acceso desde otros equipos</h3>
      </div>
      <p className="text-xs text-blue-300/80 mb-3">
        Tus compañeros pueden conectarse a este sistema ingresando cualquiera de las siguientes direcciones en su navegador:
      </p>
      <div className="flex flex-col gap-2">
        {ips.map((ip, idx) => (
          <div key={idx} className="bg-blue-900/40 px-3 py-2 rounded border border-blue-500/20 font-mono text-sm select-all">
            http://{ip}:3001
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkInfoWidget;

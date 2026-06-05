// Filtro para limpiar mensajes no deseados en la consola del navegador
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;

const filterMessage = (msg) => {
  if (typeof msg === 'string') {
    if (msg.includes('Download the React DevTools')) return true;
    if (msg.includes('THREE.WebGLRenderer: Context Lost')) return true;
  }
  return false;
};

console.log = (...args) => { if (!filterMessage(args[0])) originalLog.apply(console, args); };
console.info = (...args) => { if (!filterMessage(args[0])) originalInfo.apply(console, args); };
console.warn = (...args) => { if (!filterMessage(args[0])) originalWarn.apply(console, args); };
console.error = (...args) => { if (!filterMessage(args[0])) originalError.apply(console, args); };

// Desactivar el hook global de React DevTools si no está instalado para evitar el mensaje interno
if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  // Solo silenciar si la extensión no está presente
  if (Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__).length === 0) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {};
  }
}

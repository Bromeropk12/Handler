/**
 * Definición de permisos en el frontend (espejo de backend/src/config/permissions.js)
 * Se usa para renderizar el checklist en la UI sin depender de una llamada a la API.
 */
export const PERMISSION_MODULES = [
  {
    id: 'dashboard', label: 'Dashboard', color: 'blue',
    permissions: [
      { key: 'dashboard.view', label: 'Ver Dashboard', description: 'Acceso al panel principal con estadísticas y alertas' },
    ],
  },
  {
    id: 'samples', label: 'Muestras Globales', color: 'emerald',
    permissions: [
      { key: 'samples.view',     label: 'Ver muestras',                    description: 'Ver el listado de muestras globales' },
      { key: 'samples.create',   label: 'Crear muestras',                  description: 'Registrar nuevas muestras en el sistema' },
      { key: 'samples.edit',     label: 'Editar muestras',                 description: 'Modificar información de muestras existentes' },
      { key: 'samples.delete',   label: 'Eliminar muestras',               description: 'Borrar muestras permanentemente del sistema' },
      { key: 'samples.export',   label: 'Exportar a CSV/Excel',            description: 'Descargar el inventario de muestras en formato tabla' },
      { key: 'samples.view_coa', label: 'Ver Certificado de Análisis (CoA)', description: 'Abrir y descargar PDFs de certificados' },
    ],
  },
  {
    id: 'dispensing', label: 'Dispensación', color: 'violet',
    permissions: [
      { key: 'dispensing.view',     label: 'Ver dispensaciones',   description: 'Ver el historial de subdivisiones realizadas' },
      { key: 'dispensing.create',   label: 'Crear dispensaciones', description: 'Subdividir muestras globales en porciones menores' },
      { key: 'dispensing.reassign', label: 'Reasignar anaquel',    description: 'Cambiar la posición en anaquel de una muestra dispensada' },
    ],
  },
  {
    id: 'dispatch', label: 'Despachos', color: 'orange',
    permissions: [
      { key: 'dispatch.view',    label: 'Ver historial de despachos', description: 'Consultar el registro de despachos anteriores' },
      { key: 'dispatch.execute', label: 'Ejecutar despachos',         description: 'Realizar nuevos despachos de muestras' },
      { key: 'dispatch.fefo',    label: 'Ver recomendaciones FEFO',   description: 'Consultar sugerencias de despacho por vencimiento' },
    ],
  },
  {
    id: 'warehouse', label: 'Almacén y Anaqueles', color: 'amber',
    permissions: [
      { key: 'warehouse.view',          label: 'Ver almacén',                  description: 'Ver el mapa de almacén y estado de anaqueles' },
      { key: 'warehouse.create_shelf',  label: 'Crear anaqueles',              description: 'Agregar nuevos anaqueles al almacén' },
      { key: 'warehouse.edit_shelf',    label: 'Editar anaqueles',             description: 'Modificar configuración de anaqueles existentes' },
      { key: 'warehouse.delete_shelf',  label: 'Eliminar anaqueles',           description: 'Borrar anaqueles permanentemente' },
      { key: 'warehouse.place_sample',  label: 'Colocar muestras en anaquel',  description: 'Asignar muestras a posiciones de anaquel' },
      { key: 'warehouse.move_sample',   label: 'Mover muestras entre posiciones', description: 'Reubicar muestras entre posiciones de anaquel' },
      { key: 'warehouse.remove_sample', label: 'Retirar muestras de anaquel',  description: 'Desasignar muestras de sus posiciones' },
      { key: 'warehouse.defragment',    label: 'Defragmentar almacén',         description: 'Ejecutar reorganización automática del espacio' },
    ],
  },
  {
    id: 'movements', label: 'Movimientos', color: 'cyan',
    permissions: [
      { key: 'movements.view',   label: 'Ver movimientos',      description: 'Consultar el historial completo de movimientos y auditoría' },
      { key: 'movements.export', label: 'Exportar movimientos', description: 'Descargar el historial de movimientos en CSV' },
    ],
  },
  {
    id: 'suppliers', label: 'Proveedores', color: 'rose',
    permissions: [
      { key: 'suppliers.view',   label: 'Ver proveedores',      description: 'Consultar el directorio de proveedores' },
      { key: 'suppliers.create', label: 'Crear proveedores',    description: 'Agregar nuevos proveedores al sistema' },
      { key: 'suppliers.edit',   label: 'Editar proveedores',   description: 'Modificar información de proveedores' },
      { key: 'suppliers.delete', label: 'Eliminar proveedores', description: 'Borrar proveedores del sistema' },
    ],
  },
  {
    id: 'market_lines', label: 'Líneas de Mercado', color: 'indigo',
    permissions: [
      { key: 'market_lines.view',   label: 'Ver líneas de mercado',    description: 'Consultar las líneas de mercado registradas' },
      { key: 'market_lines.create', label: 'Crear líneas de mercado',  description: 'Agregar nuevas líneas de mercado' },
      { key: 'market_lines.edit',   label: 'Editar líneas de mercado', description: 'Modificar líneas de mercado existentes' },
      { key: 'market_lines.delete', label: 'Eliminar líneas de mercado', description: 'Borrar líneas de mercado del sistema' },
    ],
  },
  {
    id: 'alerts', label: 'Alertas', color: 'red',
    permissions: [
      { key: 'alerts.view', label: 'Ver alertas del sistema', description: 'Ver notificaciones de vencimiento y stock crítico' },
    ],
  },
  {
    id: 'reports', label: 'Reportes y Analítica', color: 'teal',
    permissions: [
      { key: 'reports.view', label: 'Ver reportes y analítica', description: 'Acceder a estadísticas avanzadas e informes del sistema' },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key));

export const DEFAULT_PERMISSIONS = (role) => {
  const defaults = {
    admin: {
      'dashboard.view': true, 'samples.view': true, 'samples.create': true, 'samples.edit': true,
      'samples.delete': true, 'samples.export': true, 'samples.view_coa': true,
      'dispensing.view': true, 'dispensing.create': true, 'dispensing.reassign': true,
      'dispatch.view': true, 'dispatch.execute': true, 'dispatch.fefo': true,
      'warehouse.view': true, 'warehouse.create_shelf': true, 'warehouse.edit_shelf': true,
      'warehouse.delete_shelf': true, 'warehouse.place_sample': true, 'warehouse.move_sample': true,
      'warehouse.remove_sample': true, 'warehouse.defragment': true,
      'movements.view': true, 'movements.export': true,
      'suppliers.view': true, 'suppliers.create': true, 'suppliers.edit': true, 'suppliers.delete': true,
      'market_lines.view': true, 'market_lines.create': true, 'market_lines.edit': true, 'market_lines.delete': true,
      'alerts.view': true, 'reports.view': true,
    },
    operator: {
      'dashboard.view': true, 'samples.view': true, 'samples.create': false, 'samples.edit': false,
      'samples.delete': false, 'samples.export': false, 'samples.view_coa': true,
      'dispensing.view': true, 'dispensing.create': false, 'dispensing.reassign': false,
      'dispatch.view': true, 'dispatch.execute': false, 'dispatch.fefo': true,
      'warehouse.view': true, 'warehouse.create_shelf': false, 'warehouse.edit_shelf': false,
      'warehouse.delete_shelf': false, 'warehouse.place_sample': false, 'warehouse.move_sample': false,
      'warehouse.remove_sample': false, 'warehouse.defragment': false,
      'movements.view': true, 'movements.export': false,
      'suppliers.view': true, 'suppliers.create': false, 'suppliers.edit': false, 'suppliers.delete': false,
      'market_lines.view': true, 'market_lines.create': false, 'market_lines.edit': false, 'market_lines.delete': false,
      'alerts.view': true, 'reports.view': false,
    },
  };
  return defaults[role] || defaults.operator;
};

export const COLOR_MAP = {
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  teal: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

/**
 * Definición central de todos los permisos del sistema Handler TrackSamples
 * Esta es la fuente de verdad — tanto backend como frontend la usan.
 *
 * Estructura: { key, label, description, module, defaultAdmin, defaultOperator }
 */

const PERMISSION_MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'chart',
    permissions: [
      { key: 'dashboard.view', label: 'Ver Dashboard', description: 'Acceso al panel principal con estadísticas y alertas', defaultAdmin: true, defaultOperator: true },
    ],
  },
  {
    id: 'samples',
    label: 'Muestras Globales',
    icon: 'beaker',
    permissions: [
      { key: 'samples.view',     label: 'Ver muestras',           description: 'Ver el listado de muestras globales',                  defaultAdmin: true, defaultOperator: true  },
      { key: 'samples.create',   label: 'Crear muestras',         description: 'Registrar nuevas muestras en el sistema',              defaultAdmin: true, defaultOperator: false },
      { key: 'samples.edit',     label: 'Editar muestras',        description: 'Modificar información de muestras existentes',         defaultAdmin: true, defaultOperator: false },
      { key: 'samples.delete',   label: 'Eliminar muestras',      description: 'Borrar muestras permanentemente del sistema',          defaultAdmin: true, defaultOperator: false },
      { key: 'samples.export',   label: 'Exportar a CSV/Excel',   description: 'Descargar el inventario de muestras en formato tabla', defaultAdmin: true, defaultOperator: false },
      { key: 'samples.view_coa', label: 'Ver Certificado de Análisis (CoA)', description: 'Abrir y descargar los PDFs de certificados', defaultAdmin: true, defaultOperator: true  },
    ],
  },
  {
    id: 'dispensing',
    label: 'Dispensación',
    icon: 'eyedropper',
    permissions: [
      { key: 'dispensing.view',     label: 'Ver dispensaciones',    description: 'Ver el historial de subdivisiones realizadas',          defaultAdmin: true, defaultOperator: true  },
      { key: 'dispensing.create',   label: 'Crear dispensaciones',  description: 'Subdividir muestras globales en porciones menores',     defaultAdmin: true, defaultOperator: false },
      { key: 'dispensing.reassign', label: 'Reasignar anaquel',     description: 'Cambiar la posición en anaquel de una muestra dispensada', defaultAdmin: true, defaultOperator: false },
    ],
  },
  {
    id: 'dispatch',
    label: 'Despachos',
    icon: 'truck',
    permissions: [
      { key: 'dispatch.view',    label: 'Ver historial de despachos', description: 'Consultar el registro de despachos anteriores', defaultAdmin: true, defaultOperator: true  },
      { key: 'dispatch.execute', label: 'Ejecutar despachos',         description: 'Realizar nuevos despachos de muestras',         defaultAdmin: true, defaultOperator: false },
      { key: 'dispatch.fefo',    label: 'Ver recomendaciones FEFO',   description: 'Consultar sugerencias de despacho por vencimiento', defaultAdmin: true, defaultOperator: true },
    ],
  },
  {
    id: 'warehouse',
    label: 'Almacén y Anaqueles',
    icon: 'building',
    permissions: [
      { key: 'warehouse.view',          label: 'Ver almacén',               description: 'Ver el mapa de almacén y estado de anaqueles',          defaultAdmin: true, defaultOperator: true  },
      { key: 'warehouse.create_shelf',  label: 'Crear anaqueles',           description: 'Agregar nuevos anaqueles al almacén',                   defaultAdmin: true, defaultOperator: false },
      { key: 'warehouse.edit_shelf',    label: 'Editar anaqueles',          description: 'Modificar configuración de anaqueles existentes',        defaultAdmin: true, defaultOperator: false },
      { key: 'warehouse.delete_shelf',  label: 'Eliminar anaqueles',        description: 'Borrar anaqueles permanentemente',                      defaultAdmin: true, defaultOperator: false },
      { key: 'warehouse.place_sample',  label: 'Colocar muestras',          description: 'Asignar muestras a posiciones de anaquel',              defaultAdmin: true, defaultOperator: false },
      { key: 'warehouse.move_sample',   label: 'Mover muestras',            description: 'Reubicar muestras entre posiciones de anaquel',         defaultAdmin: true, defaultOperator: false },
      { key: 'warehouse.remove_sample', label: 'Retirar muestras de anaquel', description: 'Desasignar muestras de sus posiciones',              defaultAdmin: true, defaultOperator: false },
      { key: 'warehouse.defragment',    label: 'Defragmentar almacén',      description: 'Ejecutar reorganización automática del espacio',        defaultAdmin: true, defaultOperator: false },
    ],
  },
  {
    id: 'movements',
    label: 'Movimientos',
    icon: 'clipboard',
    permissions: [
      { key: 'movements.view',   label: 'Ver movimientos',       description: 'Consultar el historial completo de movimientos y auditoría', defaultAdmin: true, defaultOperator: true  },
      { key: 'movements.export', label: 'Exportar movimientos',  description: 'Descargar el historial de movimientos en CSV',               defaultAdmin: true, defaultOperator: false },
    ],
  },
  {
    id: 'suppliers',
    label: 'Proveedores',
    icon: 'building-storefront',
    permissions: [
      { key: 'suppliers.view',   label: 'Ver proveedores',    description: 'Consultar el directorio de proveedores',       defaultAdmin: true, defaultOperator: true  },
      { key: 'suppliers.create', label: 'Crear proveedores',  description: 'Agregar nuevos proveedores al sistema',        defaultAdmin: true, defaultOperator: false },
      { key: 'suppliers.edit',   label: 'Editar proveedores', description: 'Modificar información de proveedores',         defaultAdmin: true, defaultOperator: false },
      { key: 'suppliers.delete', label: 'Eliminar proveedores', description: 'Borrar proveedores del sistema',             defaultAdmin: true, defaultOperator: false },
    ],
  },
  {
    id: 'market_lines',
    label: 'Líneas de Mercado',
    icon: 'squares',
    permissions: [
      { key: 'market_lines.view',   label: 'Ver líneas de mercado',    description: 'Consultar las líneas de mercado registradas',    defaultAdmin: true, defaultOperator: true  },
      { key: 'market_lines.create', label: 'Crear líneas de mercado',  description: 'Agregar nuevas líneas de mercado',               defaultAdmin: true, defaultOperator: false },
      { key: 'market_lines.edit',   label: 'Editar líneas de mercado', description: 'Modificar líneas de mercado existentes',         defaultAdmin: true, defaultOperator: false },
      { key: 'market_lines.delete', label: 'Eliminar líneas de mercado', description: 'Borrar líneas de mercado del sistema',         defaultAdmin: true, defaultOperator: false },
    ],
  },
  {
    id: 'alerts',
    label: 'Alertas',
    icon: 'bell',
    permissions: [
      { key: 'alerts.view',  label: 'Ver alertas del sistema', description: 'Ver notificaciones de vencimiento y stock crítico', defaultAdmin: true, defaultOperator: true },
    ],
  },
  {
    id: 'reports',
    label: 'Reportes y Analítica',
    icon: 'chart-bar',
    permissions: [
      { key: 'reports.view', label: 'Ver reportes y analítica', description: 'Acceder a estadísticas avanzadas e informes del sistema', defaultAdmin: true, defaultOperator: false },
    ],
  },
];

// Lista plana de todos los permisos
const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key));

// Permisos por defecto según rol
const DEFAULT_PERMISSIONS = (role) => {
  const perms = {};
  PERMISSION_MODULES.forEach(module => {
    module.permissions.forEach(p => {
      perms[p.key] = role === 'admin' ? p.defaultAdmin : p.defaultOperator;
    });
  });
  return perms;
};

module.exports = { PERMISSION_MODULES, ALL_PERMISSIONS, DEFAULT_PERMISSIONS };

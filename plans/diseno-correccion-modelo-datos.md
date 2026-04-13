# DISEÑO ARQUITECTÓNICO - Corrección de Modelo de Datos

## PROBLEMAS IDENTIFICADOS

1. Líneas de mercado hardcodeadas sin CRUD
2. Relación Anaquel-Proveedor incorrecta (VARCHAR vs many-to-many)
3. Muestras Bulk sin ubicación física en anaquel

## SOLUCIÓN

### A. CRUD de Líneas de Negocio
- Backend: controller + routes CRUD completo
- Frontend: Nueva página /market-lines

### B. Relación Many-to-Many: Anaquel ↔ Proveedores
- Nueva tabla: shelf_suppliers (shelf_id, supplier_id, is_primary)
- Eliminar columna provider de shelves

### C. Ubicación Temporal de Bulk en Anaquel
- global_samples: shelf_id, position_x, position_y, position_z, width, height, depth
- shelves: shelf_type (storage, bulk_temporary)
/**
 * Movements Controller
 * Controlador para trazabilidad de movimientos
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

/**
 * GET /api/movements
 * Obtener historial de movimientos con filtros
 */
const getMovements = async (req, res, next) => {
    try {
        const {
            action_type,
            start_date,
            end_date,
            sample_id,
            user_id,
            page = 1,
            limit = 50,
            export_csv = false
        } = req.query;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const offset = (pageNum - 1) * limitNum;
        if (offset < 0) offset = 0;
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        // Filtros
        if (action_type) {
            whereConditions.push(`m.action_type = $${paramIndex}`);
            params.push(action_type);
            paramIndex++;
        }

        if (start_date) {
            whereConditions.push(`m.timestamp >= $${paramIndex}`);
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereConditions.push(`m.timestamp <= $${paramIndex}`);
            params.push(end_date);
            paramIndex++;
        }

        if (sample_id) {
            whereConditions.push(`m.sample_id = $${paramIndex}`);
            params.push(sample_id);
            paramIndex++;
        }

        if (user_id) {
            whereConditions.push(`m.user_id = $${paramIndex}`);
            params.push(user_id);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Consulta principal
        const queryText = `
      SELECT
        m.id,
        m.sample_id,
        m.action_type,
        m.user_id,
        m.details,
        m.timestamp,
        gs.name as sample_name,
        gs.lot as sample_lot,
        gs.supplier_id,
        s.name as supplier_name,
        u.username as user_name,
        ml.name as market_line_name
      FROM movements m
      LEFT JOIN global_samples gs ON m.sample_id = gs.id
      LEFT JOIN suppliers s ON gs.supplier_id = s.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
      ${whereClause}
      ORDER BY m.timestamp DESC
    `;

        // Si es exportación CSV, obtener todos los datos
        if (export_csv === 'true') {
            if (req.user?.role !== 'admin' && (!req.user?.permissions || !req.user.permissions['movements.export'])) {
                throw new AppError('Acceso denegado. Se requiere permiso: "movements.export"', 403);
            }

            const movementsResult = await query(queryText, params);

            // Generar CSV
            const csvHeaders = [
                'ID',
                'Fecha',
                'Hora',
                'Tipo',
                'ID_Muestra',
                'Nombre_Muestra',
                'Lote',
                'ID_Proveedor',
                'Proveedor',
                'Linea_Mercado',
                'ID_Usuario',
                'Usuario',
                'Detalles'
            ];

            const csvRows = [csvHeaders.join(';')];

            // FIX #12: helper para escapar campos CSV según RFC 4180.
            //  - Si el valor contiene ;, ", \n o \r, se envuelve en comillas dobles
            //  - Las comillas dobles internas se duplican
            //  - Esto previene "CSV injection" y columnas corridas en Excel/LibreOffice
            const csvEscape = (val) => {
                if (val === null || val === undefined) return '';
                const s = String(val);
                if (s === '') return '';
                if (/[;"\n\r]/.test(s)) {
                    return `"${s.replace(/"/g, '""')}"`;
                }
                return s;
            };

            movementsResult.rows.forEach(row => {
                const details = row.details ? JSON.stringify(row.details) : '';
                const rowData = [
                    row.id,
                    row.timestamp ? new Date(row.timestamp).toISOString().split('T')[0] : '',
                    row.timestamp ? new Date(row.timestamp).toISOString().split('T')[1].split('.')[0] : '',
                    row.action_type,
                    row.sample_id || '',
                    row.sample_name || '',
                    row.sample_lot || '',
                    row.supplier_id || '',
                    row.supplier_name || '',
                    row.market_line_name || '',
                    row.user_id || '',
                    row.user_name || '',
                    csvEscape(details)
                ];
                csvRows.push(rowData.join(';'));
            });

            // BOM UTF-8 (ï»¿) necesario para que Excel en Windows abra acentos correctamente
            const BOM = '\uFEFF';
            const csvContent = BOM + csvRows.join('\n');
            const filename = `movimientos_${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            return res.send(csvContent);
        }

        // Paginación normal
        const paginatedQuery = queryText + ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limitNum, offset);

        const movementsResult = await query(paginatedQuery, params);

        // Contar total
        const countQuery = `
      SELECT COUNT(*) as total
      FROM movements m
      ${whereClause}
    `;
        const countParams = whereConditions.length > 0 ? params.slice(0, -2) : [];
        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                movements: movementsResult.rows,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/movements/types
 * Obtener tipos de movimientos disponibles
 */
const getMovementTypes = async (req, res, next) => {
    try {
        const types = [
            { value: 'created', label: 'Creación de muestra' },
            { value: 'dispensed', label: 'Dispensación' },
            { value: 'stored', label: 'Almacenamiento' },
            { value: 'moved', label: 'Movimiento' },
            { value: 'dispatched', label: 'Despacho' },
            { value: 'expired', label: 'Expiración' },
            { value: 'updated', label: 'Actualización' },
            { value: 'deleted', label: 'Eliminación' },
            { value: 'password_reset', label: 'Reseteo de contraseña' },
            { value: 'user_created', label: 'Creación de usuario' },
            { value: 'admin_password_change', label: 'Cambio de contraseña (admin)' },
            { value: 'password_change', label: 'Cambio de contraseña' },
            { value: 'username_change', label: 'Cambio de usuario' },
            { value: 'user_deleted', label: 'Eliminación de usuario' }
        ];

        res.json({
            success: true,
            data: {
                types
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/movements/summary
 * Obtener resumen de movimientos
 */
const getMovementsSummary = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (start_date) {
            whereConditions.push(`timestamp >= $${paramIndex}`);
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            whereConditions.push(`timestamp <= $${paramIndex}`);
            params.push(end_date);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Contar por tipo de movimiento
        const typesResult = await query(`
      SELECT action_type, COUNT(*) as count
      FROM movements
      ${whereClause}
      GROUP BY action_type
      ORDER BY count DESC
    `, params);

        // Contar por usuario (top 10)
        const usersResult = await query(`
      SELECT 
        m.user_id,
        u.username,
        COUNT(*) as count
      FROM movements m
      JOIN users u ON m.user_id = u.id
      ${whereClause}
      GROUP BY m.user_id, u.username
      ORDER BY count DESC
      LIMIT 10
    `, params);

        // Contar por tipo de muestra
        // Nota: se usa condición inline para no colisionar con whereClause que ya incluye WHERE
        const sampleWhereExtra = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';
        const samplesResult = await query(`
      SELECT 
        m.action_type,
        COUNT(DISTINCT m.sample_id) as sample_count
      FROM movements m
      WHERE m.sample_id IS NOT NULL
      ${sampleWhereExtra}
      GROUP BY m.action_type
    `, params);

        res.json({
            success: true,
            data: {
                by_type: typesResult.rows,
                by_user: usersResult.rows,
                by_sample: samplesResult.rows
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMovements,
    getMovementTypes,
    getMovementsSummary
};

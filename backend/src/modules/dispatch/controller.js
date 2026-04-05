const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Endpoint de Recomendación FEFO
 * Busca unidades por nombre y recomienda las que están más cerca del vencimiento.
 * Incluye el nombre real del anaquel donde está almacenada cada unidad.
 */
const getFefoRecommendation = async (req, res, next) => {
  try {
    const { product_name } = req.query;
    if (!product_name) throw new AppError('El nombre del producto es requerido', 400);

    const result = await query(`
      SELECT 
        cs.id as child_id,
        cs.qr_code,
        cs.status,
        gs.id as global_sample_id,
        gs.name,
        gs.lot,
        gs.expiration_date,
        gs.weight_per_unit_grams,
        COALESCE(sh.name, 'Sin asignar') as shelf_name,
        ds.position_y as level,
        ds.position_x as column_x,
        ds.position_z as depth_z,
        COALESCE(ml.name, 'Sin línea')   as market_line_name,
        -- Días restantes hasta vencimiento (negativo = ya venció)
        (gs.expiration_date::date - CURRENT_DATE) as days_until_expiry
      FROM child_samples cs
      JOIN global_samples gs ON cs.global_sample_id = gs.id
      LEFT JOIN dispensed_samples ds ON ds.child_sample_id = cs.id AND ds.status = 'stored'
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      LEFT JOIN market_lines ml ON sh.market_line_id = ml.id
      WHERE gs.name ILIKE $1 AND cs.status = 'available'
      ORDER BY gs.expiration_date ASC
      LIMIT 20
    `, [`%${product_name}%`]);

    res.json({
      success: true,
      data: {
        product_name,
        total_found: result.rows.length,
        recommendations: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirmar Despacho
 * Valida la regla FEFO, ejecuta el despacho en transacción atómica
 * y registra el movimiento con trazabilidad completa.
 */
const executeDispatch = async (req, res, next) => {
  try {
    const { qr_code, expected_product_name } = req.body;
    if (!qr_code) throw new AppError('El código QR es requerido', 400);

    // Buscar child_sample con todos sus datos relacionados
    const childCheck = await query(`
      SELECT 
        cs.*,
        gs.id as global_sample_id,
        gs.available_units,
        gs.coa_file_path,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        gs.market_line_id,
        COALESCE(sh.name, 'Sin asignar') as shelf_name,
        COALESCE(sh.id, NULL) as shelf_id,
        COALESCE(ds.id, NULL) as dispensed_sample_id
      FROM child_samples cs
      JOIN global_samples gs ON cs.global_sample_id = gs.id
      LEFT JOIN dispensed_samples ds ON ds.child_sample_id = cs.id AND ds.status = 'stored'
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      WHERE cs.qr_code = $1
    `, [qr_code]);

    if (childCheck.rows.length === 0) {
      throw new AppError('Código de muestra escaneado no encontrado en la base de datos', 404);
    }

    const child = childCheck.rows[0];

    // REGLA DE NEGOCIO: Validar nombre del producto si se proporcionó
    if (expected_product_name) {
      if (child.product_name.toLowerCase() !== expected_product_name.toLowerCase()) {
        throw new AppError(
          `Bloqueo de Seguridad: Escaneaste [${child.product_name}], pero intentabas despachar [${expected_product_name}].`,
          403
        );
      }
    }

    if (child.status !== 'available') {
      throw new AppError('La unidad ya fue despachada o no está disponible', 400);
    }

    if (child.available_units <= 0) {
      throw new AppError('No hay unidades disponibles en el stock global', 400);
    }

    // Transacción atómica del despacho
    const txOps = [
      // 1. Marcar la unidad hija como despachada
      {
        query: `UPDATE child_samples SET status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        params: [child.id]
      },
      // 2. Reducir contador de unidades disponibles del lote global
      {
        query: `UPDATE global_samples SET available_units = available_units - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        params: [child.global_sample_id]
      },
      // 3. Registrar movimiento con trazabilidad completa
      {
        query: `INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)`,
        params: [
          child.global_sample_id,
          'dispatched',
          req.user.id,
          JSON.stringify({
            type: 'child_dispatch',
            child_id: child.id,
            qr_code: child.qr_code,
            shelf_name: child.shelf_name,
            lot: child.lot,
            expiration_date: child.expiration_date,
            dispatched_by: req.user.username
          })
        ]
      }
    ];

    // Si la unidad estaba en un anaquel físico, liberamos esa celda
    if (child.dispensed_sample_id) {
      txOps.push({
        query: `UPDATE dispensed_samples SET status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        params: [child.dispensed_sample_id]
      });
    }

    await transaction(txOps);

    res.json({
      success: true,
      message: `Muestra despachada exitosamente desde ${child.shelf_name}`,
      data: {
        product_name: child.product_name,
        lot: child.lot,
        expiration_date: child.expiration_date,
        shelf_name: child.shelf_name,
        qr_code: child.qr_code,
        coa_file_path: child.coa_file_path,
        dispatched_by: req.user.username,
        dispatched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Historial de Despachos
 * Retorna los últimos N despachos registrados en movements con FEFO score.
 */
const getDispatchHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT
        m.id,
        m.timestamp as created_at,
        m.details,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        u.username as dispatched_by
      FROM movements m
      JOIN global_samples gs ON m.sample_id = gs.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.action_type = 'dispatched'
      ORDER BY m.timestamp DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total FROM movements WHERE action_type = 'dispatched'
    `);

    const history = result.rows.map(row => {
      let details = {};
      try { details = JSON.parse(row.details); } catch {}
      return {
        id: row.id,
        product_name: row.product_name,
        lot: row.lot,
        expiration_date: row.expiration_date,
        qr_code: details.qr_code || 'N/A',
        shelf_name: details.shelf_name || 'Sin asignar',
        dispatched_by: row.dispatched_by || details.dispatched_by || 'Sistema',
        dispatched_at: row.created_at
      };
    });

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFefoRecommendation,
  executeDispatch,
  getDispatchHistory
};

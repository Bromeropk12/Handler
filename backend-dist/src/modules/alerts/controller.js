/**
 * Alerts Controller
 * Gestión de alertas de vencimiento para muestras químicas
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

/**
 * GET /api/alerts/expired
 * Obtener productos vencidos
 */
const getExpiredAlerts = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        ds.id,
        ds.qr_code,
        ds.status,
        ds.position_x,
        ds.position_y,
        ds.position_z,
        ds.shelf_id,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        gs.ghs_danger_class,
        gs.coa_file_path,
        sh.name as shelf_name,
        ml.name as market_line_name,
        (gs.expiration_date::date - CURRENT_DATE) as days_overdue
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      LEFT JOIN market_lines ml ON sh.market_line_id = ml.id
      WHERE ds.status = 'stored' 
        AND gs.expiration_date < CURRENT_DATE
      ORDER BY gs.expiration_date ASC
    `);

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        total: result.rows.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts/expiring
 * Obtener productos por vencer
 * Query params: days (default 30)
 */
const getExpiringAlerts = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const result = await query(`
      SELECT 
        ds.id,
        ds.qr_code,
        ds.status,
        ds.position_x,
        ds.position_y,
        ds.position_z,
        ds.shelf_id,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        gs.ghs_danger_class,
        gs.coa_file_path,
        sh.name as shelf_name,
        ml.name as market_line_name,
        (gs.expiration_date::date - CURRENT_DATE) as days_until_expiry
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      LEFT JOIN market_lines ml ON sh.market_line_id = ml.id
      WHERE ds.status = 'stored' 
        AND gs.expiration_date >= CURRENT_DATE
        AND gs.expiration_date <= CURRENT_DATE + ($1 || ' days')::INTERVAL
      ORDER BY gs.expiration_date ASC
    `, [days]);

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        total: result.rows.length,
        days_threshold: days
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts/summary
 * Resumen combinado de todas las alertas
 */
const getAlertsSummary = async (req, res, next) => {
  try {
    // Productos vencidos
    const expiredResult = await query(`
      SELECT COUNT(*) as total
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.status = 'stored' AND gs.expiration_date < CURRENT_DATE
    `);

    // Productos por vencer en 30 días
    const warning30Result = await query(`
      SELECT COUNT(*) as total
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.status = 'stored' 
        AND gs.expiration_date >= CURRENT_DATE
        AND gs.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
    `);

    // Productos por vencer en 60 días
    const warning60Result = await query(`
      SELECT COUNT(*) as total
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.status = 'stored' 
        AND gs.expiration_date >= CURRENT_DATE
        AND gs.expiration_date <= CURRENT_DATE + INTERVAL '60 days'
    `);

    // Top 5 alertas más urgentes
    const topAlerts = await query(`
      SELECT 
        ds.id,
        ds.qr_code,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        gs.ghs_danger_class,
        sh.name as shelf_name,
        ml.name as market_line_name,
        (gs.expiration_date::date - CURRENT_DATE) as days_until_expiry,
        CASE 
          WHEN gs.expiration_date < CURRENT_DATE THEN 'expired'
          WHEN gs.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
          ELSE 'caution'
        END as alert_type
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      LEFT JOIN market_lines ml ON sh.market_line_id = ml.id
      WHERE ds.status = 'stored' 
        AND gs.expiration_date <= CURRENT_DATE + INTERVAL '60 days'
      ORDER BY gs.expiration_date ASC
      LIMIT 5
    `);

    const expired = parseInt(expiredResult.rows[0].total);
    const warning30 = parseInt(warning30Result.rows[0].total);
    const warning60 = parseInt(warning60Result.rows[0].total);
    const caution60 = warning60 - warning30; // Solo 31-60 días

    res.json({
      success: true,
      data: {
        counts: {
          expired,
          warning: warning30,
          caution: caution60,
          total: expired + warning30 + caution60
        },
        top_alerts: topAlerts.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpiredAlerts,
  getExpiringAlerts,
  getAlertsSummary
};
const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    // Contar muestras dispensadas almacenadas
    const samplesCheck = await query(`
      SELECT 
        COUNT(ds.id) as total_samples
      FROM dispensed_samples ds
      WHERE ds.status = 'stored'
    `);

    // Contar anaqueles totales
    const shelvesCheck = await query(`
      SELECT COUNT(*) as total_shelves FROM shelves
    `);

    // Contar productos vencidos
    const expiredCheck = await query(`
      SELECT COUNT(*) as expired_count 
      FROM global_samples 
      WHERE expiration_date < CURRENT_DATE
    `);

    // Contar productos por vencer (30 días)
    const warningCheck = await query(`
      SELECT COUNT(*) as warning_count 
      FROM global_samples 
      WHERE expiration_date >= CURRENT_DATE 
        AND expiration_date <= CURRENT_DATE + INTERVAL '30 days'
    `);

    // Calcular ocupación real basada en posiciones 3D disponibles vs ocupadas
    const occupancyCheck = await query(`
        SELECT
          COALESCE(SUM(grid_width * grid_height * shelf_depth), 0) as total_positions
        FROM shelves
        WHERE grid_width > 0 AND grid_height > 0 AND shelf_depth > 0
    `);

    const filledCheck = await query(`
        SELECT COUNT(*) as occupied_positions
        FROM dispensed_samples
        WHERE status = 'stored'
          AND position_x IS NOT NULL
          AND position_y IS NOT NULL
          AND position_z IS NOT NULL
          AND shelf_id IS NOT NULL
    `);

    // Market lines stats con cálculo real de ocupación
    const mlStats = await query(`
      SELECT
        ml.name,
        COUNT(DISTINCT sh.id) as shelves,
        COALESCE(SUM(sh.grid_width * sh.grid_height * sh.shelf_depth), 0) as total_positions,
        COUNT(DISTINCT ds.id) as occupied_positions
      FROM market_lines ml
      LEFT JOIN shelves sh ON sh.market_line_id = ml.id AND sh.grid_width > 0 AND sh.grid_height > 0 AND sh.shelf_depth > 0
      LEFT JOIN global_samples gs ON gs.market_line_id = ml.id
      LEFT JOIN dispensed_samples ds ON ds.global_sample_id = gs.id
        AND ds.status = 'stored'
        AND ds.position_x IS NOT NULL
        AND ds.position_y IS NOT NULL
        AND ds.position_z IS NOT NULL
        AND ds.shelf_id IS NOT NULL
      GROUP BY ml.id, ml.name
    `);

    // Alerts (Ultimos despachos, movimientos, etc)
    const alerts = await query(`
      SELECT 
       gs.name,
       gs.lot,
       m.action_type,
       m.timestamp as created_at
      FROM movements m
      JOIN global_samples gs ON m.sample_id = gs.id
      ORDER BY m.timestamp DESC
      LIMIT 6
    `);

    const totalSamples = parseInt(samplesCheck.rows[0].total_samples);
    const totalShelves = parseInt(shelvesCheck.rows[0].total_shelves);
    const expiredCount = parseInt(expiredCheck.rows[0].expired_count);
    const warningCount = parseInt(warningCheck.rows[0].warning_count);
    const maxCapacity = parseInt(occupancyCheck.rows[0].max_capacity);
    const currentlyStored = parseInt(filledCheck.rows[0].currently_stored);

    const avgOccupancy = maxCapacity > 0 ? Math.round((currentlyStored / maxCapacity) * 100) : 0;

    // Format ML stats with accurate occupancy calculations
    const marketLines = mlStats.rows.map((row, index) => {
      const colors = ['bg-pink-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500'];
      const totalPositions = parseInt(row.total_positions) || 0;
      const occupiedPositions = parseInt(row.occupied_positions) || 0;
      const occupancy = totalPositions > 0 ? Math.min(100, Math.round((occupiedPositions / totalPositions) * 100)) : 0;

      return {
        name: row.name,
        shelves: parseInt(row.shelves),
        samples: occupiedPositions, // Mostrar posiciones ocupadas, no conteo de samples
        totalPositions,
        occupiedPositions,
        occupancy,
        color: colors[index % colors.length]
      };
    });

    const recentAlerts = alerts.rows.map(a => {
      let type = 'info';
      let text = '';
      if (a.action_type === 'created') text = `Nueva muestra: ${a.name} (Lote: ${a.lot})`;
      if (a.action_type === 'dispensed') { text = `Subdivisión en almacén: ${a.name}`; type = 'warning'; }
      if (a.action_type === 'dispatched') { text = `Despacho completado: ${a.name} (Lote: ${a.lot})`; type = 'success'; }

      return {
        type, text,
        time: new Date(a.created_at).toLocaleString()
      }
    });

    res.json({
      success: true,
      data: {
        totalSamples,
        totalShelves,
        avgOccupancy,
        expiredCount,
        warningCount,
        marketLines,
        recentAlerts
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    const bulkCheck = await query(`
      SELECT 
        COUNT(cs.id) as total_samples,
        (SELECT COUNT(*) FROM shelves) as total_shelves,
        (SELECT COUNT(*) FROM global_samples WHERE expiration_date < CURRENT_DATE) as expired_count,
        (SELECT COUNT(*) FROM global_samples WHERE expiration_date >= CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '30 days') as warning_count
      FROM child_samples cs
      WHERE cs.status = 'available'
    `);
    
    // Obtener ocupación real de los anaqueles
    const occupancyCheck = await query(`
        SELECT 
          COALESCE(SUM(grid_width * grid_height), 0) as max_capacity
        FROM shelves
    `);
    
    const filledCheck = await query(`
        SELECT COUNT(*) as currently_stored
        FROM dispensed_samples 
        WHERE status = 'stored'
    `);

    // Market lines stats
    const mlStats = await query(`
      SELECT ml.name, 
        COUNT(DISTINCT sh.id) as shelves,
        COUNT(DISTINCT cs.id) as samples
      FROM market_lines ml
      LEFT JOIN global_samples gs ON gs.market_line_id = ml.id
      LEFT JOIN child_samples cs ON cs.global_sample_id = gs.id AND cs.status = 'available'
      LEFT JOIN shelves sh ON sh.market_line_id = ml.id
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

    const stats = bulkCheck.rows[0];
    const maxCapacity = parseInt(occupancyCheck.rows[0].max_capacity);
    const currentlyStored = parseInt(filledCheck.rows[0].currently_stored);
    
    const avgOccupancy = maxCapacity > 0 ? Math.round((currentlyStored / maxCapacity) * 100) : 0;

    // Format ML stats to have % occupancy visually
    const marketLines = mlStats.rows.map((row, index) => {
       const colors = ['bg-pink-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500'];
       // For mock purposes if shelf capacities individually are not calc'd here: using simple ratio
       const occupancy = row.shelves > 0 ? Math.min(100, Math.round((row.samples / parseInt(row.shelves)) * 10)) : 0;
       return {
         name: row.name,
         shelves: parseInt(row.shelves),
         samples: parseInt(row.samples),
         occupancy,
         color: colors[index % colors.length]
       };
    });

    const recentAlerts = alerts.rows.map(a => {
      let type = 'info';
      let text = '';
      if(a.action_type === 'created') text = `Nueva muestra: ${a.name} (Lote: ${a.lot})`;
      if(a.action_type === 'dispensed') { text = `Subdivisión en almacén: ${a.name}`; type = 'warning'; }
      if(a.action_type === 'dispatched') { text = `Despacho completado: ${a.name} (Lote: ${a.lot})`; type = 'success'; }

      return {
        type, text,
        time: new Date(a.created_at).toLocaleString()
      }
    });

    res.json({
      success: true,
      data: {
        totalSamples: parseInt(stats.total_samples),
        totalShelves: parseInt(stats.total_shelves),
        avgOccupancy,
        expiredCount: parseInt(stats.expired_count),
        warningCount: parseInt(stats.warning_count),
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

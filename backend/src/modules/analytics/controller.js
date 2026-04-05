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
        COUNT(DISTINCT ds.id) as samples
      FROM market_lines ml
      LEFT JOIN shelves sh ON sh.market_line_id = ml.id
      LEFT JOIN global_samples gs ON gs.market_line_id = ml.id
      LEFT JOIN dispensed_samples ds ON ds.global_sample_id = gs.id AND ds.status = 'stored'
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

    // Format ML stats to have % occupancy visually
    const marketLines = mlStats.rows.map((row, index) => {
       const colors = ['bg-pink-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500'];
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

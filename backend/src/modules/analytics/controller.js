const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    // Estadísticas de muestras globales (bulk)
    const bulkStats = await query(`
      SELECT
        COUNT(*) as total_bulk,
        COUNT(*) FILTER (WHERE total_units = 0) as pending_dispensing,
        COUNT(*) FILTER (WHERE total_units > 0 AND available_units = 0) as empty,
        COUNT(*) FILTER (WHERE total_units > 0 AND available_units > 0) as available,
        COUNT(*) FILTER (WHERE expiration_date < CURRENT_DATE) as expired,
        COUNT(*) FILTER (WHERE expiration_date >= CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '30 days') as warning
      FROM global_samples
    `);

    // Muestras dispensadas (hijas) almacenadas
    const dispensedStats = await query(`
      SELECT
        COUNT(*) as total_dispensed,
        COUNT(*) FILTER (WHERE status = 'stored') as stored,
        COUNT(*) FILTER (WHERE status = 'dispatched') as dispatched
      FROM dispensed_samples
    `);

    // Contar anaqueles totales y por tipo
    const shelvesCheck = await query(`
      SELECT
        COUNT(*) as total_shelves,
        COUNT(*) FILTER (WHERE shelf_type = 'refrigerated') as refrigerated_shelves,
        COUNT(*) FILTER (WHERE shelf_type = 'ambient') as ambient_shelves
      FROM shelves
    `);

    // Muestras vencidas (con detalles)
    const expiredSamples = await query(`
      SELECT
        gs.id,
        gs.name,
        gs.lot,
        gs.expiration_date,
        gs.supplier_id,
        sup.name as supplier_name,
        ml.name as market_line_name
      FROM global_samples gs
      LEFT JOIN suppliers sup ON gs.supplier_id = sup.id
      LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
      WHERE gs.expiration_date < CURRENT_DATE
      ORDER BY gs.expiration_date ASC
      LIMIT 10
    `);

    // Muestras por vencer (30 días)
    const warningSamples = await query(`
      SELECT
        gs.id,
        gs.name,
        gs.lot,
        gs.expiration_date,
        gs.supplier_id,
        sup.name as supplier_name,
        ml.name as market_line_name,
        FLOOR((gs.expiration_date - CURRENT_DATE)) as days_remaining
      FROM global_samples gs
      LEFT JOIN suppliers sup ON gs.supplier_id = sup.id
      LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
      WHERE gs.expiration_date >= CURRENT_DATE
        AND gs.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY gs.expiration_date ASC
      LIMIT 10
    `);

    const expiredCount = expiredSamples.rows.length;
    const warningCount = warningSamples.rows.length;

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

    // Extraer estadísticas
    const bulk = bulkStats.rows[0];
    const dispensed = dispensedStats.rows[0];
    const shelves = shelvesCheck.rows[0];

    const totalBulkSamples = parseInt(bulk.total_bulk) || 0;
    const pendingDispensing = parseInt(bulk.pending_dispensing) || 0; // total_units = 0
    const emptySamples = parseInt(bulk.empty) || 0; // total_units > 0 Y available_units = 0
    const availableSamples = parseInt(bulk.available) || 0; // total_units > 0 Y available_units > 0
    const expiredFromBulk = parseInt(bulk.expired) || 0;
    const warningFromBulk = parseInt(bulk.warning) || 0;

    const totalDispensed = parseInt(dispensed.total_dispensed) || 0;
    const storedCount = parseInt(dispensed.stored) || 0;
    const dispatchedCount = parseInt(dispensed.dispatched) || 0;

    const totalShelves = parseInt(shelves.total_shelves) || 0;
    const refrigeratedShelves = parseInt(shelves.refrigerated_shelves) || 0;
    const ambientShelves = parseInt(shelves.ambient_shelves) || 0;

    const totalPositions = parseInt(occupancyCheck.rows[0].total_positions) || 0;
    const occupiedPositions = parseInt(filledCheck.rows[0].occupied_positions) || 0;

    // Cálculos de ocupación más precisos
    const avgOccupancy = totalPositions > 0 ? Math.round((occupiedPositions / totalPositions) * 100) : 0;
    const freePositions = totalPositions - occupiedPositions;

    // Cálculos de muestras
    const totalActiveSamples = availableSamples + emptySamples; // Muestras con unidades (disponibles + vacías)
    const totalInactiveSamples = pendingDispensing; // Pendientes por dispensar

    // avgOccupancy ya calculado arriba (línea 151)

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

    // Formatear muestras vencidas y por vencer para el frontend
    const formattedExpired = expiredSamples.rows.map(row => ({
      id: row.id,
      name: row.name,
      lot: row.lot,
      expiration_date: row.expiration_date,
      supplier_name: row.supplier_name || 'N/A',
      market_line_name: row.market_line_name || 'N/A',
      days_expired: Math.floor((new Date() - new Date(row.expiration_date)) / (1000 * 60 * 60 * 24))
    }));

    const formattedWarnings = warningSamples.rows.map(row => ({
      id: row.id,
      name: row.name,
      lot: row.lot,
      expiration_date: row.expiration_date,
      supplier_name: row.supplier_name || 'N/A',
      market_line_name: row.market_line_name || 'N/A',
      days_remaining: parseInt(row.days_remaining)
    }));

    res.json({
      success: true,
      data: {
        // Muestras Bulk (globales)
        totalBulkSamples,
        pendingDispensing,
        emptySamples,
        availableSamples,
        // Muestras Dispensadas (hijas)
        totalDispensed,
        storedCount,
        dispatchedCount,
        // Anaqueles
        totalShelves,
        refrigeratedShelves,
        ambientShelves,
        // Ocupación
        totalPositions,
        occupiedPositions,
        freePositions,
        avgOccupancy,
        // Alertas
        expiredCount,
        warningCount,
        expiredSamples: formattedExpired,
        warningSamples: formattedWarnings,
        // Otros
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

const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Subdividir un Bulk Sample en Muestras Hijas (Dispensación)
 * Genera muestras dispensadas con QR único y ubicación automática SGA
 */
const subdivideBulkSample = async (req, res, next) => {
  try {
    const { global_sample_id, number_of_units, weight_per_unit } = req.body;
    
    if (!global_sample_id) throw new AppError('El ID del Bulk Sample es requerido', 400);
    if (!number_of_units || number_of_units <= 0) throw new AppError('El número de unidades debe ser mayor a 0', 400);
    if (!weight_per_unit || weight_per_unit <= 0) throw new AppError('El peso por unidad debe ser mayor a 0', 400);

    // Verificar que el bulk existe y tiene unidades disponibles
    const bulkCheck = await query(
      'SELECT id, name, lot, available_units, weight_per_unit_grams, coa_file_path, dimensions, ghs_danger_class FROM global_samples WHERE id = $1', 
      [global_sample_id]
    );
    
    if (bulkCheck.rows.length === 0) throw new AppError('Muestra global no encontrada', 404);
    
    const bulk = bulkCheck.rows[0];

    // Verificar que hay suficientes unidades disponibles
    if (bulk.available_units < number_of_units) {
      throw new AppError(`Solo hay ${bulk.available_units} unidades disponibles. Solicitó ${number_of_units}.`, 400);
    }

    const txQueries = [];
    const generatedSamples = [];

    // Generar cada muestra dispensada
    for (let i = 0; i < number_of_units; i++) {
      // Generar QR único
      const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
      const qrCode = `HS-${bulk.lot}-${Date.now().toString().slice(-4)}${uniqueNumber}-${i + 1}`;
      
      // Parsear dimensiones del enum
      const dimParts = bulk.dimensions.split('x');
      const width = parseInt(dimParts[0]);
      const height = parseInt(dimParts[1]);

      // QR data con metadata completa
      const qrData = {
        id: uuidv4(),
        lot: bulk.lot,
        product_name: bulk.name,
        sub_sample_number: i + 1,
        weight_grams: weight_per_unit,
        expiration_date: null, // Se obtiene del bulk
        ghs_danger_class: bulk.ghs_danger_class
      };

      generatedSamples.push({ qr_code: qrCode, qr_data: qrData });
      
      txQueries.push({
        query: `
          INSERT INTO dispensed_samples (
            global_sample_id, qr_code, qr_data, weight_grams, status,
            width, height
          ) VALUES ($1, $2, $3, $4, 'stored', $5, $6)
          RETURNING id
        `,
        params: [global_sample_id, qrCode, JSON.stringify(qrData), weight_per_unit, width, height]
      });
    }

    // Actualizar contador de unidades disponibles del bulk
    txQueries.push({
      query: 'UPDATE global_samples SET available_units = available_units - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      params: [number_of_units, global_sample_id]
    });

    // Registrar movimiento
    txQueries.push({
      query: `INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)`,
      params: [
        global_sample_id, 
        'dispensed', 
        req.user.id,
        JSON.stringify({ 
          type: 'subdivision', 
          units_generated: number_of_units,
          weight_per_unit,
          total_weight: number_of_units * weight_per_unit
        })
      ]
    });

    await transaction(txQueries);

    res.json({
      success: true,
      message: `Se han dispensado exitosamente ${number_of_units} unidades de ${bulk.name} (Lote: ${bulk.lot}).`,
      data: {
        generated_samples: generatedSamples,
        bulk_name: bulk.name,
        bulk_lot: bulk.lot,
        remaining_units: bulk.available_units - number_of_units
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener muestras dispensadas de un bulk
 */
const getDispensedSamples = async (req, res, next) => {
  try {
    const { global_sample_id, status } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (global_sample_id) {
      whereConditions.push(`ds.global_sample_id = $${paramIndex}`);
      params.push(global_sample_id);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`ds.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        ds.*,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        gs.ghs_danger_class,
        gs.coa_file_path,
        sh.name as shelf_name,
        ml.name as market_line_name
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      LEFT JOIN market_lines ml ON sh.market_line_id = ml.id
      ${whereClause}
      ORDER BY ds.created_at DESC
      LIMIT 100
    `, params);

    res.json({
      success: true,
      data: {
        samples: result.rows,
        total: result.rows.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  subdivideBulkSample,
  getDispensedSamples
};

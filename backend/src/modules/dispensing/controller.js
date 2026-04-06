const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { findAutoPlacement, parseDimensions } = require('../warehouse/validations');

/**
 * Subdividir un Bulk Sample en Muestras Hijas (Dispensación)
 * Genera muestras dispensadas con QR único y ubicación automática SGA
 * 
 * Flujo:
 * 1. Crea las muestras hijas sin ubicación (pendientes por ubicar)
 * 2. Ejecuta algoritmo SGA para encontrar ubicación óptima
 * 3. Asigna automáticamente la ubicación encontrada
 */
const subdivideBulkSample = async (req, res, next) => {
  try {
    const { global_sample_id, number_of_units, weight_per_unit } = req.body;
    
    if (!global_sample_id) throw new AppError('El ID del Bulk Sample es requerido', 400);
    if (!number_of_units || number_of_units <= 0) throw new AppError('El número de unidades debe ser mayor a 0', 400);
    if (!weight_per_unit || weight_per_unit <= 0) throw new AppError('El peso por unidad debe ser mayor a 0', 400);

    // Verificar que el bulk existe y tiene unidades disponibles
    const bulkCheck = await query(
      'SELECT id, name, lot, available_units, weight_per_unit_grams, coa_file_path, dimensions, ghs_danger_class, market_line_id FROM global_samples WHERE id = $1', 
      [global_sample_id]
    );
    
    if (bulkCheck.rows.length === 0) throw new AppError('Muestra global no encontrada', 404);
    
    const bulk = bulkCheck.rows[0];

    // Verificar que hay suficientes unidades disponibles
    if (bulk.available_units < number_of_units) {
      throw new AppError(`Solo hay ${bulk.available_units} unidades disponibles. Solicitó ${number_of_units}.`, 400);
    }

    // Parsear dimensiones del enum 3D
    const dimensions = parseDimensions(bulk.dimensions);
    const width = dimensions.width;
    const height = dimensions.height;
    const depth = dimensions.depth;

    const txQueries = [];
    const generatedSamples = [];

    // Generar cada muestra dispensada (sin ubicación inicial)
    for (let i = 0; i < number_of_units; i++) {
      // Generar QR único
      const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
      const qrCode = `HS-${bulk.lot}-${Date.now().toString().slice(-4)}${uniqueNumber}-${i + 1}`;

      // QR data con metadata completa
      const qrData = {
        id: uuidv4(),
        lot: bulk.lot,
        product_name: bulk.name,
        sub_sample_number: i + 1,
        weight_grams: weight_per_unit,
        expiration_date: null,
        ghs_danger_class: bulk.ghs_danger_class
      };

      generatedSamples.push({ qr_code: qrCode, qr_data: qrData });
      
      txQueries.push({
        query: `
          INSERT INTO dispensed_samples (
            global_sample_id, qr_code, qr_data, weight_grams, status,
            width, height, depth, shelf_id, position_x, position_y, position_z
          ) VALUES ($1, $2, $3, $4, 'stored', $5, $6, $7, NULL, NULL, NULL, NULL)
          RETURNING id
        `,
        params: [global_sample_id, qrCode, JSON.stringify(qrData), weight_per_unit, width, height, depth]
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

    // Ejecutar transacción para crear muestras
    const txResult = await transaction(txQueries);
    
    // Extraer IDs de las muestras creadas
    const sampleIds = txResult
      .slice(0, number_of_units)
      .map(result => result.rows[0].id);

    // ==========================================
    // ALGORITMO SGA AUTOMÁTICO DE UBICACIÓN
    // ==========================================
    
    // Obtener anaqueles de la línea de mercado del bulk, ordenados por ocupación
    const shelvesResult = await query(`
      SELECT 
        sh.*,
        (SELECT COUNT(*) FROM dispensed_samples ds WHERE ds.shelf_id = sh.id AND ds.status = 'stored') as occupied_cells
      FROM shelves sh
      WHERE sh.market_line_id = $1
      ORDER BY occupied_cells ASC
    `, [bulk.market_line_id]);

    if (shelvesResult.rows.length === 0) {
      throw new AppError(`No hay anaqueles disponibles para la línea de mercado del bulk.`, 400);
    }

    const placements = [];
    const failedPlacements = [];

    // Para cada muestra, encontrar ubicación óptima con SGA
    for (const sampleId of sampleIds) {
      // Obtener datos de la muestra
      const sampleData = await query(
        'SELECT ds.*, gs.ghs_danger_class FROM dispensed_samples ds JOIN global_samples gs ON ds.global_sample_id = gs.id WHERE ds.id = $1',
        [sampleId]
      );

      if (sampleData.rows.length === 0) continue;

      const sample = sampleData.rows[0];
      sample.width = width;
      sample.height = height;
      sample.depth = depth;

      let placed = false;

      // Intentar colocar en cada anaquel hasta encontrar uno con espacio
      for (const shelf of shelvesResult.rows) {
        try {
          const autoPos = await findAutoPlacement(shelf, sample);

          // Colocar en el anaquel encontrado
          await query(`
            UPDATE dispensed_samples
            SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [shelf.id, autoPos.x, autoPos.y, autoPos.z, sampleId]);

          placements.push({
            sample_id: sampleId,
            qr_code: sample.qr_code,
            shelf_name: shelf.name,
            position: { x: autoPos.x, y: autoPos.y, z: autoPos.z },
            dimensions: `${width}x${height}x${depth}`
          });

          placed = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!placed) {
        failedPlacements.push({
          sample_id: sampleId,
          qr_code: sample.qr_code,
          error: 'No se encontró espacio compatible en ningún anaquel de la línea de mercado'
        });
      }
    }

    res.json({
      success: true,
      message: `Se han dispensado exitosamente ${number_of_units} unidades de ${bulk.name} (Lote: ${bulk.lot}).`,
      data: {
        generated_samples: generatedSamples,
        placements,
        failed_placements: failedPlacements,
        bulk_name: bulk.name,
        bulk_lot: bulk.lot,
        remaining_units: bulk.available_units - number_of_units,
        sga_danger_class: bulk.ghs_danger_class
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
    const { global_sample_id, status, shelf_id } = req.query;

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

    if (shelf_id) {
      whereConditions.push(`ds.shelf_id = $${paramIndex}`);
      params.push(shelf_id);
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

/**
 * Obtener muestras pendientes por ubicar (sin anaquel asignado)
 */
const getUnplacedSamples = async (req, res, next) => {
  try {
    const { market_line_id } = req.query;

    let whereClause = "WHERE ds.shelf_id IS NULL AND ds.status = 'stored'";
    let params = [];
    let paramIndex = 1;

    if (market_line_id) {
      whereClause += ` AND gs.market_line_id = $${paramIndex}`;
      params.push(market_line_id);
      paramIndex++;
    }

    const result = await query(`
      SELECT 
        ds.*,
        gs.name as product_name,
        gs.lot,
        gs.ghs_danger_class,
        gs.dimensions,
        ml.name as market_line_name
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      JOIN market_lines ml ON gs.market_line_id = ml.id
      ${whereClause}
      ORDER BY ds.created_at ASC
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
  getDispensedSamples,
  getUnplacedSamples
};

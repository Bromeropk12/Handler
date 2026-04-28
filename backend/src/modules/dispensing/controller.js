const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { findAutoPlacement, parseDimensions } = require('../warehouse/validations');

/**
 * Subdividir un Bulk Sample en Muestras Hijas (Dispensación)
 * 
 * Cambios clave vs versión anterior:
 * - BLOQUEA re-dispensación: si el bulk ya tiene total_units > 0, error
 * - Recibe child_dimensions del request (tamaño del frasco hijo, NO del bulk)
 * - Peso correcto: weight_per_unit es el peso de cada frasco hijo
 * - QR data enriquecido con pictogramas y señal
 */
const subdivideBulkSample = async (req, res, next) => {
  try {
    const { global_sample_id, weight_per_unit, child_dimensions, shelf_id } = req.body;
    const number_of_units = parseInt(req.body.number_of_units, 10);

    if (!global_sample_id) throw new AppError('El ID del Bulk Sample es requerido', 400);
    if (!number_of_units || number_of_units <= 0) throw new AppError('El número de unidades debe ser mayor a 0', 400);
    if (!weight_per_unit || weight_per_unit <= 0) throw new AppError('El peso por frasco hijo debe ser mayor a 0', 400);
    if (!child_dimensions) throw new AppError('Las dimensiones del frasco hijo son requeridas', 400);

    // Verificar que el bulk existe
    const bulkCheck = await query(`
      SELECT gs.*, sup.name as supplier_name, sup.logo_path as supplier_logo_path,
             COALESCE(gs.dispensed_size, '1x1x1') as dispensed_size
      FROM global_samples gs
      LEFT JOIN suppliers sup ON gs.supplier_id = sup.id
      WHERE gs.id = $1
    `, [global_sample_id]);

    if (bulkCheck.rows.length === 0) throw new AppError('Muestra global no encontrada', 404);

    const bulk = bulkCheck.rows[0];

    // *** BLOQUEAR RE-DISPENSACIÓN ***
    if (bulk.total_units > 0) {
      throw new AppError(
        `Esta muestra global ya fue dispensada (${bulk.total_units} unidades hijas existentes). No se permite crear más hijas del mismo lote. Si necesita más producto, registre un nuevo lote.`,
        400
      );
    }

    // Parsear dimensiones del FRASCO HIJO (NO del bulk)
    const dims = parseDimensions(child_dimensions);
    const childWidth = dims.width;
    const childHeight = dims.height;
    const childDepth = dims.depth || 1;

    const txQueries = [];
    const generatedSamples = [];

    // Generar cada muestra dispensada
    for (let i = 0; i < number_of_units; i++) {
      // Generar código corto único (7 chars alfanumérico aleatorio + secuencia hija)
      // Ejemplo: "A3K9M2X-1", "B7NP4QZ-2" — no expone el lote en la etiqueta
      const SHORT_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let shortBase = '';
      let qrCode = '';
      let attempts = 0;
      do {
        shortBase = Array.from({ length: 7 }, () =>
          SHORT_CHARS[Math.floor(Math.random() * SHORT_CHARS.length)]
        ).join('');
        qrCode = `${shortBase}-${i + 1}`;
        // Verificar unicidad (evitar colisiones extremadamente raras)
        const existing = await query('SELECT 1 FROM dispensed_samples WHERE qr_code = $1', [qrCode]);
        if (existing.rows.length === 0) break;
        attempts++;
      } while (attempts < 10);

      // QR data enriquecido para la etiqueta
      const qrData = {
        id: uuidv4(),
        lot: bulk.lot,
        product_name: bulk.name,
        sub_sample_number: i + 1,
        total_sub_samples: number_of_units,
        weight_grams: parseFloat(weight_per_unit),
        expiration_date: bulk.expiration_date,
        manufacture_date: bulk.manufacture_date,
        ghs_danger_class: bulk.ghs_danger_class,
        ghs_pictograms: bulk.ghs_pictograms || [],
        signal_word: bulk.signal_word || 'ATENCION',
        supplier_name: bulk.supplier_name,
        supplier_id: bulk.supplier_id,
        supplier_logo_path: bulk.supplier_logo_path,
        market_line_id: bulk.market_line_id,
        child_dimensions: child_dimensions
      };

      generatedSamples.push({ qr_code: qrCode, qr_data: qrData });

      txQueries.push({
        query: `
          INSERT INTO dispensed_samples (
            global_sample_id, qr_code, qr_data, weight_grams, status,
            width, height, depth, child_dimensions,
            shelf_id, position_x, position_y, position_z
          ) VALUES ($1, $2, $3, $4, 'stored', $5, $6, $7, $8, NULL, NULL, NULL, NULL)
          RETURNING id
        `,
        params: [
          global_sample_id, qrCode, JSON.stringify(qrData),
          parseFloat(weight_per_unit),
          childWidth, childHeight, childDepth, child_dimensions
        ]
      });
    }

    // Actualizar contadores del bulk
    txQueries.push({
      query: 'UPDATE global_samples SET available_units = $1, total_units = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
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
          weight_per_unit: parseFloat(weight_per_unit),
          child_dimensions: child_dimensions,
          total_weight: number_of_units * parseFloat(weight_per_unit)
        })
      ]
    });

    // Ejecutar transacción
    const txResult = await transaction(txQueries);

    // Extraer IDs de las muestras creadas
    const sampleIds = txResult
      .slice(0, number_of_units)
      .map(result => result.rows[0].id);

    // ALGORITMO SGA AUTOMÁTICO DE UBICACIÓN
    // Si el usuario escogió un anaquel, ponerlo primero en la lista
    let shelvesQuery;
    if (shelf_id) {
      shelvesQuery = await query(`
        SELECT 
          sh.*,
          (SELECT COUNT(*) FROM dispensed_samples ds WHERE ds.shelf_id = sh.id AND ds.status = 'stored') as occupied_cells
        FROM shelves sh
        WHERE sh.id = $1
        UNION ALL
        SELECT 
          sh.*,
          (SELECT COUNT(*) FROM dispensed_samples ds WHERE ds.shelf_id = sh.id AND ds.status = 'stored') as occupied_cells
        FROM shelves sh
        WHERE sh.market_line_id = $2 AND sh.id != $1
        ORDER BY occupied_cells ASC
      `, [shelf_id, bulk.market_line_id]);
    } else {
      shelvesQuery = await query(`
        SELECT 
          sh.*,
          (SELECT COUNT(*) FROM dispensed_samples ds WHERE ds.shelf_id = sh.id AND ds.status = 'stored') as occupied_cells
        FROM shelves sh
        WHERE sh.market_line_id = $1
        ORDER BY occupied_cells ASC
      `, [bulk.market_line_id]);
    }
    const shelvesResult = shelvesQuery;

    if (shelvesResult.rows.length === 0) {
      // No hay anaqueles pero la dispensación fue exitosa - quedan sin ubicar
      return res.json({
        success: true,
        message: `Se han dispensado ${number_of_units} unidades de ${bulk.name} pero no hay anaqueles disponibles para ubicarlas automáticamente.`,
        data: {
          generated_samples: generatedSamples,
          placements: [],
          failed_placements: sampleIds.map((id, i) => ({
            sample_id: id,
            qr_code: generatedSamples[i].qr_code,
            error: 'Sin anaqueles disponibles en la línea de mercado'
          })),
          bulk_name: bulk.name,
          bulk_lot: bulk.lot,
          sga_danger_class: bulk.ghs_danger_class
        }
      });
    }

    const placements = [];
    const failedPlacements = [];

    // Datos de la muestra para colocación, usando dimensiones del FRASCO HIJO
    const sampleTemplate = {
      width: childWidth,
      height: childHeight,
      depth: childDepth,
      ghs_danger_class: bulk.ghs_danger_class
    };

    // Intentar colocar TODAS en un mismo anaquel (agrupadas)
    let allPlaced = false;
    for (const shelf of shelvesResult.rows) {
      const shelfPlacements = [];
      let shelfSuccess = true;

      for (let i = 0; i < sampleIds.length; i++) {
        const sampleId = sampleIds[i];
        const sample = { ...sampleTemplate, id: sampleId };

        try {
          const autoPos = await findAutoPlacement(shelf, sample);
          await query(`
            UPDATE dispensed_samples
            SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [shelf.id, autoPos.x, autoPos.y, autoPos.z || 0, sampleId]);

          shelfPlacements.push({
            sample_id: sampleId,
            qr_code: generatedSamples[i].qr_code,
            shelf_name: shelf.name,
            position: { x: autoPos.x, y: autoPos.y, z: autoPos.z || 0 },
            dimensions: child_dimensions
          });
        } catch (e) {
          // Revertir colocaciones de este anaquel
          for (const placed of shelfPlacements) {
            await query(`
              UPDATE dispensed_samples
              SET shelf_id = NULL, position_x = NULL, position_y = NULL, position_z = NULL
              WHERE id = $1
            `, [placed.sample_id]);
          }
          shelfSuccess = false;
          break;
        }
      }

      if (shelfSuccess) {
        placements.push(...shelfPlacements);
        allPlaced = true;
        break;
      }
    }

    // Si no caben todas juntas, colocar individualmente como fallback
    if (!allPlaced) {
      for (let i = 0; i < sampleIds.length; i++) {
        const sampleId = sampleIds[i];
        const sample = { ...sampleTemplate, id: sampleId };
        let placed = false;

        for (const shelf of shelvesResult.rows) {
          try {
            const autoPos = await findAutoPlacement(shelf, sample);
            await query(`
              UPDATE dispensed_samples
              SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4, updated_at = CURRENT_TIMESTAMP
              WHERE id = $5
            `, [shelf.id, autoPos.x, autoPos.y, autoPos.z || 0, sampleId]);

            placements.push({
              sample_id: sampleId,
              qr_code: generatedSamples[i].qr_code,
              shelf_name: shelf.name,
              position: { x: autoPos.x, y: autoPos.y, z: autoPos.z || 0 },
              dimensions: child_dimensions
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
            qr_code: generatedSamples[i].qr_code,
            error: 'No se encontró espacio compatible en ningún anaquel'
          });
        }
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
        bulk_expiration: bulk.expiration_date,
        sga_danger_class: bulk.ghs_danger_class,
        signal_word: bulk.signal_word,
        ghs_pictograms: bulk.ghs_pictograms,
        supplier_name: bulk.supplier_name,
        supplier_logo_path: bulk.supplier_logo_path,
        child_dimensions: child_dimensions,
        weight_per_unit: parseFloat(weight_per_unit)
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
        gs.ghs_pictograms,
        gs.signal_word,
        gs.coa_file_path,
        gs.total_weight_grams as bulk_total_weight,
        sh.name as shelf_name,
        ml.name as market_line_name,
        sup.name as supplier_name,
        sup.logo_path as supplier_logo_path
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      LEFT JOIN market_lines ml ON sh.market_line_id = ml.id
      LEFT JOIN suppliers sup ON gs.supplier_id = sup.id
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
        gs.dimensions as bulk_dimensions,
        ds.child_dimensions,
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
  getUnplacedSamples,
  reassignShelf
};

/**
 * Reasignar todas las muestras hijas de un bulk a un anaquel diferente
 * PUT /api/dispensing/reassign-shelf
 */
async function reassignShelf(req, res, next) {
  try {
    const { global_sample_id, shelf_id } = req.body;
    if (!global_sample_id) throw new AppError('global_sample_id es requerido', 400);
    if (!shelf_id) throw new AppError('shelf_id es requerido', 400);

    // Verificar que el anaquel existe
    const shelfCheck = await query('SELECT * FROM shelves WHERE id = $1', [shelf_id]);
    if (shelfCheck.rows.length === 0) throw new AppError('Anaquel no encontrado', 404);
    const shelf = shelfCheck.rows[0];

    // Obtener todas las muestras hijas almacenadas
    const childSamples = await query(`
      SELECT id, width, height, depth, child_dimensions
      FROM dispensed_samples
      WHERE global_sample_id = $1 AND status = 'stored'
      ORDER BY created_at ASC
    `, [global_sample_id]);

    if (childSamples.rows.length === 0) {
      throw new AppError('No hay muestras hijas almacenadas para reasignar', 404);
    }

    // Limpiar ubicaciones actuales
    await query(`
      UPDATE dispensed_samples
      SET shelf_id = NULL, position_x = NULL, position_y = NULL, position_z = NULL
      WHERE global_sample_id = $1 AND status = 'stored'
    `, [global_sample_id]);

    const placements = [];
    const failed = [];

    for (const child of childSamples.rows) {
      try {
        const autoPos = await findAutoPlacement(shelf, child);
        await query(`
          UPDATE dispensed_samples
          SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [shelf.id, autoPos.x, autoPos.y, autoPos.z || 0, child.id]);
        placements.push({ id: child.id, position: autoPos });
      } catch (e) {
        failed.push({ id: child.id, error: e.message });
      }
    }

    res.json({
      success: true,
      message: `${placements.length} muestras reasignadas al anaquel "${shelf.name}". ${failed.length > 0 ? `${failed.length} no cupieron.` : ''}`,
      data: { placements, failed, shelf_name: shelf.name }
    });
  } catch (err) {
    next(err);
  }
}


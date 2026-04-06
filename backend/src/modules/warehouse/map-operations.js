/**
 * Map Operations Module
 * Operaciones del mapa 2D y gestión de posiciones
 * 
 * Grid 2D: X = Columna (horizontal), Y = Nivel (vertical)
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { validatePlacement, parseDimensions, findAutoPlacement } = require('./validations');

/**
 * Genera matriz 2D del grid con las muestras colocadas
 * matrix[y][x] donde y = nivel (fila), x = columna
 */
function generateGridMatrix(shelf, samples) {
  const rows = shelf.grid_height || 10;
  const cols = shelf.grid_width || 10;
  
  // Crear matriz vacía
  const matrix = Array(rows).fill(null).map(() => Array(cols).fill(null));

  // Llenar con muestras
  samples.forEach(sample => {
    const startX = sample.position_x;
    const startY = sample.position_y;
    const width = sample.width || 1;
    const height = sample.height || 1;

    for (let y = startY; y < startY + height && y < rows; y++) {
      for (let x = startX; x < startX + width && x < cols; x++) {
        matrix[y][x] = {
          sample_id: sample.id,
          is_main_cell: (x === startX && y === startY),
          ...(x === startX && y === startY ? {
            name: sample.global_sample_name,
            lot: sample.lot,
            weight_grams: sample.weight_grams,
            ghs_danger_class: sample.ghs_danger_class,
            expiration_date: sample.expiration_date,
            qr_code: sample.qr_code,
            status: sample.status,
            width,
            height
          } : {})
        };
      }
    }
  });

  return matrix;
}

/**
 * Obtener mapa completo de un anaquel
 */
const getShelfMap = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el anaquel existe
    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    // Obtener todas las muestras del anaquel
    const samples = await query(`
      SELECT
        ds.*,
        gs.name as global_sample_name,
        gs.lot,
        gs.expiration_date,
        gs.ghs_danger_class
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.shelf_id = $1 AND ds.status = 'stored'
      ORDER BY ds.position_y DESC, ds.position_x ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        shelf: shelf.rows[0],
        samples: samples.rows,
        grid_matrix: generateGridMatrix(shelf.rows[0], samples.rows)
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Colocar muestra en posición específica o auto-asignar
 */
const placeSample = async (req, res, next) => {
  try {
    const { id } = req.params; // shelf_id
    let { sample_id, position_x, position_y } = req.body;

    if (!sample_id) {
      throw new AppError('Se requiere: sample_id', 400);
    }

    // Verificar que el anaquel existe
    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    // Verificar que la muestra existe
    const sample = await query(`
      SELECT ds.*, gs.ghs_danger_class, gs.dimensions
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.id = $1 AND ds.status = 'stored'
    `, [sample_id]);

    if (sample.rows.length === 0) {
      throw new AppError('Muestra no encontrada o no disponible para colocar', 404);
    }

    const sampleData = sample.rows[0];

    // Calcular dimensiones basado en el enum
    const dimensions = parseDimensions(sampleData.dimensions);
    sampleData.width = dimensions.width;
    sampleData.height = dimensions.height;

    // Si faltan coordenadas, auto-asignar con algoritmo SGA
    if (position_x === undefined || position_y === undefined) {
      const autoPos = await findAutoPlacement(shelf.rows[0], sampleData);
      position_x = autoPos.x;
      position_y = autoPos.y;
    }

    // Validar posicionamiento
    await validatePlacement(shelf.rows[0], sampleData, position_x, position_y);

    // Actualizar posición de la muestra
    await query(`
      UPDATE dispensed_samples
      SET shelf_id = $1, position_x = $2, position_y = $3,
          width = $4, height = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [id, position_x, position_y, sampleData.width, sampleData.height, sample_id]);

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      sample_id,
      'stored',
      req.user.id,
      JSON.stringify({
        type: 'sample_placement',
        shelf_id: id,
        position: { x: position_x, y: position_y },
        dimensions: `${sampleData.width}x${sampleData.height}`
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra colocada exitosamente',
      data: {
        sample_id,
        position: { x: position_x, y: position_y },
        dimensions: `${sampleData.width}x${sampleData.height}`
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mover muestra a nueva posición
 */
const moveSample = async (req, res, next) => {
  try {
    const { id } = req.params; // shelf_id
    const { sample_id, new_position_x, new_position_y } = req.body;

    // Verificar que la muestra está en este anaquel
    const sample = await query(`
      SELECT ds.*, gs.ghs_danger_class, gs.dimensions
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.id = $1 AND ds.shelf_id = $2 AND ds.status = 'stored'
    `, [sample_id, id]);

    if (sample.rows.length === 0) {
      throw new AppError('Muestra no encontrada en este anaquel', 404);
    }

    const sampleData = sample.rows[0];
    const dimensions = parseDimensions(sampleData.dimensions);
    sampleData.width = dimensions.width;
    sampleData.height = dimensions.height;

    // Validar nueva posición
    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    await validatePlacement(shelf.rows[0], sampleData, new_position_x, new_position_y);

    // Actualizar posición
    await query(`
      UPDATE dispensed_samples
      SET position_x = $1, position_y = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [new_position_x, new_position_y, sample_id]);

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      sample_id,
      'moved',
      req.user.id,
      JSON.stringify({
        type: 'sample_movement',
        shelf_id: id,
        from_position: { x: sampleData.position_x, y: sampleData.position_y },
        to_position: { x: new_position_x, y: new_position_y }
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra movida exitosamente',
      data: {
        sample_id,
        new_position: { x: new_position_x, y: new_position_y }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Quitar muestra del anaquel
 */
const removeSample = async (req, res, next) => {
  try {
    const { id } = req.params; // shelf_id
    const { sample_id } = req.body;

    // Verificar que la muestra está en este anaquel
    const sample = await query(`
      SELECT ds.*
      FROM dispensed_samples ds
      WHERE ds.id = $1 AND ds.shelf_id = $2 AND ds.status = 'stored'
    `, [sample_id, id]);

    if (sample.rows.length === 0) {
      throw new AppError('Muestra no encontrada en este anaquel', 404);
    }

    const oldPosition = {
      x: sample.rows[0].position_x,
      y: sample.rows[0].position_y
    };

    // Quitar del anaquel
    await query(`
      UPDATE dispensed_samples
      SET shelf_id = NULL, position_x = NULL, position_y = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [sample_id]);

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      sample_id,
      'moved',
      req.user.id,
      JSON.stringify({
        type: 'sample_removal',
        shelf_id: id,
        from_position: oldPosition
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra removida del anaquel exitosamente',
      data: {
        sample_id,
        removed_from: oldPosition
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Auto-colocar múltiples muestras con algoritmo SGA
 * Recibe un array de sample_ids y coloca cada una automáticamente
 */
const autoPlaceSamples = async (req, res, next) => {
  try {
    const { id } = req.params; // shelf_id
    const { sample_ids } = req.body;

    if (!sample_ids || !Array.isArray(sample_ids) || sample_ids.length === 0) {
      throw new AppError('Se requiere un array de sample_ids', 400);
    }

    // Verificar que el anaquel existe
    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    const placements = [];

    for (const sampleId of sample_ids) {
      // Obtener datos de la muestra
      const sample = await query(`
        SELECT ds.*, gs.ghs_danger_class, gs.dimensions
        FROM dispensed_samples ds
        JOIN global_samples gs ON ds.global_sample_id = gs.id
        WHERE ds.id = $1 AND ds.status = 'stored' AND ds.shelf_id IS NULL
      `, [sampleId]);

      if (sample.rows.length === 0) {
        placements.push({
          sample_id: sampleId,
          success: false,
          error: 'Muestra no encontrada o ya colocada'
        });
        continue;
      }

      const sampleData = sample.rows[0];
      const dimensions = parseDimensions(sampleData.dimensions);
      sampleData.width = dimensions.width;
      sampleData.height = dimensions.height;

      try {
        // Encontrar posición automática
        const autoPos = await findAutoPlacement(shelf.rows[0], sampleData);

        // Colocar en la BD
        await query(`
          UPDATE dispensed_samples
          SET shelf_id = $1, position_x = $2, position_y = $3,
              width = $4, height = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
        `, [id, autoPos.x, autoPos.y, sampleData.width, sampleData.height, sampleId]);

        placements.push({
          sample_id: sampleId,
          success: true,
          position: { x: autoPos.x, y: autoPos.y },
          dimensions: `${sampleData.width}x${sampleData.height}`
        });
      } catch (e) {
        placements.push({
          sample_id: sampleId,
          success: false,
          error: e.message
        });
      }
    }

    res.json({
      success: true,
      message: `Colocación automática completada: ${placements.filter(p => p.success).length}/${sample_ids.length} exitosas`,
      data: { placements }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShelfMap,
  placeSample,
  moveSample,
  removeSample,
  autoPlaceSamples,
  generateGridMatrix
};
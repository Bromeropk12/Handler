/**
 * Map Operations Module
 * Operaciones del mapa 2D y gestión de posiciones
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { validatePlacement, parseDimensions } = require('./validations');

/**
 * Genera matriz 2D del grid con las muestras colocadas
 */
function generateGridMatrix(shelf, samples) {
  // matrix[level][pos_z][pos_x]
  // level: 0 to grid_height - 1
  // z: 0 to shelf_depth - 1
  // x: 0 to grid_width - 1
  const matrix = Array(shelf.grid_height || 10).fill(null).map(() =>
    Array(shelf.shelf_depth || 10).fill(null).map(() =>
      Array(shelf.grid_width || 10).fill(null)
    )
  );

  samples.forEach(sample => {
    // sample.height es la ocupación de profundidad (Z)
    // sample.width es la ocupación horizontal (X)
    for (let z = 0; z < (sample.height || 1); z++) {
      for (let x = 0; x < (sample.width || 1); x++) {
        const level = sample.position_y;
        const posZ = sample.position_z + z;
        const posX = sample.position_x + x;

        if (level < shelf.grid_height && posZ < shelf.shelf_depth && posX < shelf.grid_width) {
          matrix[level][posZ][posX] = {
            sample_id: sample.id,
            is_main_cell: (x === 0 && z === 0),
            ...(x === 0 && z === 0 ? {
              name: sample.global_sample_name,
              lot: sample.lot,
              weight_grams: sample.weight_grams,
              ghs_danger_class: sample.ghs_danger_class,
              expiration_date: sample.expiration_date,
              qr_code: sample.qr_code
            } : {})
          };
        }
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
      ORDER BY ds.position_y, ds.position_z, ds.position_x

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
 * Colocar muestra en posición específica
 */
const placeSample = async (req, res, next) => {
  try {
    const { id } = req.params; // shelf_id
    let { sample_id, position_x, position_y, position_z } = req.body;
    const { findAutoPlacement } = require('./validations');

    if (!sample_id) {
      throw new AppError('Se requiere: sample_id', 400);
    }

    // Verificar que el anaquel existe
    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    // Verificar que la muestra existe y no está colocada
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

    // Si faltan coordenadas, intentar auto-asignar
    if (position_x === undefined || position_y === undefined) {
      const autoPos = await findAutoPlacement(shelf.rows[0], sampleData);
      position_x = autoPos.x;
      position_y = autoPos.y;
      position_z = autoPos.z;
    } else if (position_z === undefined) {
      position_z = 0;
    }

    // Validar posicionamiento (ya lo valida findAutoPlacement, pero para los manuales)
    await validatePlacement(shelf.rows[0], sampleData, position_x, position_y, position_z);

    // Actualizar posición de la muestra
    await query(`
      UPDATE dispensed_samples
      SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4,
          width = $5, height = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [id, position_x, position_y, position_z, sampleData.width, sampleData.height, sample_id]);

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
    const { sample_id, new_position_x, new_position_y, new_position_z = 0 } = req.body;

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
    await validatePlacement(shelf.rows[0], sampleData, new_position_x, new_position_y, new_position_z);

    // Actualizar posición
    await query(`
      UPDATE dispensed_samples
      SET position_x = $1, position_y = $2, position_z = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [new_position_x, new_position_y, new_position_z, sample_id]);

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
        from_position: { x: sampleData.position_x, y: sampleData.position_y, z: sampleData.position_z },
        to_position: { x: new_position_x, y: new_position_y, z: new_position_z }
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra movida exitosamente',
      data: {
        sample_id,
        new_position: { x: new_position_x, y: new_position_y, z: new_position_z }
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
      y: sample.rows[0].position_y,
      z: sample.rows[0].position_z
    };

    // Quitar del anaquel (poner status como 'stored' sin posición)
    await query(`
      UPDATE dispensed_samples
      SET shelf_id = NULL, position_x = NULL, position_y = NULL, position_z = NULL,
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

module.exports = {
  getShelfMap,
  placeSample,
  moveSample,
  removeSample,
  generateGridMatrix
};
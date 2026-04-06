/**
 * Map Operations Module - 3D
 * Operaciones del mapa 3D y gestión de posiciones
 * 
 * Grid 3D: X = Columna (horizontal), Y = Nivel (vertical), Z = Profundidad
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { validatePlacement, parseDimensions, findAutoPlacement } = require('./validations');

/**
 * Genera matriz 3D del grid con las muestras colocadas
 * matrix[y][z][x] donde y = nivel, z = profundidad, x = columna
 */
function generateGridMatrix3D(shelf, samples) {
  const levels = shelf.grid_height || 10;
  const depth = shelf.shelf_depth || 10;
  const cols = shelf.grid_width || 10;
  
  const matrix = Array(levels).fill(null).map(() =>
    Array(depth).fill(null).map(() => Array(cols).fill(null))
  );

  samples.forEach(sample => {
    const startX = sample.position_x;
    const startY = sample.position_y;
    const startZ = sample.position_z || 0;
    const width = sample.width || 1;
    const height = sample.height || 1;
    const sampleDepth = sample.depth || 1;

    for (let y = startY; y < startY + height && y < levels; y++) {
      for (let z = startZ; z < startZ + sampleDepth && z < depth; z++) {
        for (let x = startX; x < startX + width && x < cols; x++) {
          matrix[y][z][x] = {
            sample_id: sample.id,
            is_main_cell: (x === startX && y === startY && z === startZ),
            ...(x === startX && y === startY && z === startZ ? {
              name: sample.global_sample_name,
              lot: sample.lot,
              weight_grams: sample.weight_grams,
              ghs_danger_class: sample.ghs_danger_class,
              expiration_date: sample.expiration_date,
              qr_code: sample.qr_code,
              status: sample.status,
              width,
              height,
              depth: sampleDepth
            } : {})
          };
        }
      }
    }
  });

  return matrix;
}

/**
 * Obtener mapa completo de un anaquel 3D
 */
const getShelfMap = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

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
      ORDER BY ds.position_y DESC, ds.position_z ASC, ds.position_x ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        shelf: shelf.rows[0],
        samples: samples.rows,
        grid_matrix_3d: samples.rows.length > 0 ? generateGridMatrix3D(shelf.rows[0], samples.rows) : []
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Colocar muestra en posición 3D específica o auto-asignar
 */
const placeSample = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { sample_id, position_x, position_y, position_z } = req.body;

    if (!sample_id) {
      throw new AppError('Se requiere: sample_id', 400);
    }

    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

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
    const dimensions = parseDimensions(sampleData.dimensions);
    sampleData.width = dimensions.width;
    sampleData.height = dimensions.height;
    sampleData.depth = dimensions.depth;

    if (position_x === undefined || position_y === undefined || position_z === undefined) {
      const autoPos = await findAutoPlacement(shelf.rows[0], sampleData);
      position_x = autoPos.x;
      position_y = autoPos.y;
      position_z = autoPos.z;
    }

    await validatePlacement(shelf.rows[0], sampleData, position_x, position_y, position_z);

    await query(`
      UPDATE dispensed_samples
      SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4,
          width = $5, height = $6, depth = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [id, position_x, position_y, position_z, sampleData.width, sampleData.height, sampleData.depth, sample_id]);

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
        position: { x: position_x, y: position_y, z: position_z },
        dimensions: `${sampleData.width}x${sampleData.height}x${sampleData.depth}`
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra colocada exitosamente',
      data: {
        sample_id,
        position: { x: position_x, y: position_y, z: position_z },
        dimensions: `${sampleData.width}x${sampleData.height}x${sampleData.depth}`
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mover muestra a nueva posición 3D
 */
const moveSample = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sample_id, new_position_x, new_position_y, new_position_z } = req.body;

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
    sampleData.depth = dimensions.depth;

    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    const finalZ = new_position_z !== undefined ? new_position_z : (sampleData.position_z || 0);
    await validatePlacement(shelf.rows[0], sampleData, new_position_x, new_position_y, finalZ);

    await query(`
      UPDATE dispensed_samples
      SET position_x = $1, position_y = $2, position_z = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [new_position_x, new_position_y, finalZ, sample_id]);

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
        to_position: { x: new_position_x, y: new_position_y, z: finalZ }
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra movida exitosamente',
      data: {
        sample_id,
        new_position: { x: new_position_x, y: new_position_y, z: finalZ }
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
    const { id } = req.params;
    const { sample_id } = req.body;

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

    await query(`
      UPDATE dispensed_samples
      SET shelf_id = NULL, position_x = NULL, position_y = NULL, position_z = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [sample_id]);

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
 * Auto-colocar múltiples muestras con algoritmo SGA 3D
 */
const autoPlaceSamples = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sample_ids } = req.body;

    if (!sample_ids || !Array.isArray(sample_ids) || sample_ids.length === 0) {
      throw new AppError('Se requiere un array de sample_ids', 400);
    }

    const shelf = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    const placements = [];

    for (const sampleId of sample_ids) {
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
      sampleData.depth = dimensions.depth;

      try {
        const autoPos = await findAutoPlacement(shelf.rows[0], sampleData);

        await query(`
          UPDATE dispensed_samples
          SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4,
              width = $5, height = $6, depth = $7, updated_at = CURRENT_TIMESTAMP
          WHERE id = $8
        `, [id, autoPos.x, autoPos.y, autoPos.z, sampleData.width, sampleData.height, sampleData.depth, sampleId]);

        placements.push({
          sample_id: sampleId,
          success: true,
          position: { x: autoPos.x, y: autoPos.y, z: autoPos.z },
          dimensions: `${sampleData.width}x${sampleData.height}x${sampleData.depth}`
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
      message: `Colocación automática 3D completada: ${placements.filter(p => p.success).length}/${sample_ids.length} exitosas`,
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
  generateGridMatrix3D
};
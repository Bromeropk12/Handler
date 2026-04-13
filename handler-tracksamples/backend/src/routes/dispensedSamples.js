import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { SGAService } from '../services/sgaService.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { shelf_id, status, global_sample_id } = req.query;
    let sql = `
      SELECT ds.*, gs.name as sample_name, gs.provider, gs.lot, gs.expiration_date, 
             gs.ghs_danger_class, s.name as shelf_name, ml.name as market_line_name
      FROM dispensed_samples ds
      LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves s ON ds.shelf_id = s.id
      LEFT JOIN market_lines ml ON s.market_line_id = ml.id
      WHERE 1=1
    `;
    const params = [];

    if (shelf_id) {
      params.push(shelf_id);
      sql += ` AND ds.shelf_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND ds.status = $${params.length}`;
    }

    if (global_sample_id) {
      params.push(global_sample_id);
      sql += ` AND ds.global_sample_id = $${params.length}`;
    }

    sql += ' ORDER BY ds.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener muestras dispensadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT ds.*, gs.name as sample_name, gs.ghs_danger_class, gs.dimensions
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       WHERE ds.shelf_id IS NULL AND ds.status = 'stored'
       ORDER BY ds.created_at ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener muestras pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/dispense', authenticateToken, async (req, res) => {
  try {
    const { global_sample_id, subdivisions, weight_per_subdivision } = req.body;

    if (!global_sample_id || !subdivisions || !weight_per_subdivision) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const globalSample = await query('SELECT * FROM global_samples WHERE id = $1', [global_sample_id]);
    
    if (globalSample.rows.length === 0) {
      return res.status(404).json({ error: 'Muestra global no encontrada' });
    }

    const bulk = globalSample.rows[0];
    const totalWeight = subdivisions * weight_per_subdivision;

    if (totalWeight > bulk.total_weight_grams) {
      return res.status(400).json({ error: 'Stock insuficiente en la muestra global' });
    }

    const createdSamples = [];
    
    for (let i = 0; i < subdivisions; i++) {
      const qrCode = `QR-${bulk.lot}-${Date.now()}-${i + 1}`;
      
      const result = await query(
        `INSERT INTO dispensed_samples (global_sample_id, qr_code, weight_grams, status) 
         VALUES ($1, $2, $3, 'stored') 
         RETURNING *`,
        [global_sample_id, qrCode, weight_per_subdivision]
      );

      createdSamples.push(result.rows[0]);

      await query(
        `INSERT INTO movements (sample_id, sample_type, action_type, user_id, details) 
         VALUES ($1, 'dispensed', 'dispensed', $2, $3)`,
        [result.rows[0].id, req.user.id, JSON.stringify({ qr_code: qrCode, weight: weight_per_subdivision })]
      );
    }

    await query(
      'UPDATE global_samples SET total_weight_grams = total_weight_grams - $1 WHERE id = $2',
      [totalWeight, global_sample_id]
    );

    res.status(201).json({
      message: `Se crearon ${subdivisions} muestras`,
      samples: createdSamples
    });
  } catch (error) {
    console.error('Error al dispensar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/auto-organize', authenticateToken, async (req, res) => {
  try {
    const { market_line_id } = req.body;

    const pendingSamples = await query(
      `SELECT ds.*, gs.name as sample_name, gs.ghs_danger_class, gs.dimensions
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       WHERE ds.shelf_id IS NULL AND ds.status = 'stored'
       ORDER BY ds.created_at ASC`
    );

    if (pendingSamples.rows.length === 0) {
      return res.json({ message: 'No hay muestras pendientes por organizar', organized: 0 });
    }

    const shelves = await query(
      'SELECT * FROM shelves WHERE market_line_id = $1 ORDER BY name',
      [market_line_id]
    );

    const organized = [];
    const errors = [];

    for (const sample of pendingSamples.rows) {
      const dimension = sample.dimensions || '1x1';
      const [width, height] = dimension.split('x').map(Number);
      
      const placed = await SGAService.findAndPlaceSample(
        sample, 
        width, 
        height, 
        sample.ghs_danger_class,
        shelves.rows,
        market_line_id
      );

      if (placed) {
        organized.push(sample.id);
      } else {
        errors.push({ sample: sample.sample_name, reason: 'Espacio insuficiente' });
      }
    }

    res.json({
      organized: organized.length,
      samples: organized,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Error en auto-organizar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id/relocate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { shelf_id, position_x, position_y } = req.body;

    if (!shelf_id || position_x === undefined || position_y === undefined) {
      return res.status(400).json({ error: 'Anaquel y posición son requeridos' });
    }

    const sample = await query('SELECT * FROM dispensed_samples WHERE id = $1', [id]);
    
    if (sample.rows.length === 0) {
      return res.status(404).json({ error: 'Muestra dispensada no encontrada' });
    }

    const globalSample = await query(
      'SELECT * FROM global_samples WHERE id = $1',
      [sample.rows[0].global_sample_id]
    );

    const dimension = globalSample.rows[0].dimensions || '1x1';
    const [width, height] = dimension.split('x').map(Number);

    const isValidPosition = await SGAService.validatePosition(
      shelf_id, position_x, position_y, width, height
    );

    if (!isValidPosition) {
      return res.status(400).json({ error: 'La posición no es válida o está ocupada' });
    }

    const result = await query(
      'UPDATE dispensed_samples SET shelf_id = $1, position_x = $2, position_y = $3 WHERE id = $4 RETURNING *',
      [shelf_id, position_x, position_y, id]
    );

    await query(
      `INSERT INTO movements (sample_id, sample_type, action_type, user_id, details) 
       VALUES ($1, 'dispensed', 'relocated', $2, $3)`,
      [id, req.user.id, JSON.stringify({ shelf_id, position_x, position_y })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al reubicar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/dispatch', authenticateToken, async (req, res) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({ error: 'Código QR requerido' });
    }

    const sample = await query(
      `SELECT ds.*, gs.name, gs.lot, gs.expiration_date, gs.provider, s.name as shelf_name
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       LEFT JOIN shelves s ON ds.shelf_id = s.id
       WHERE ds.qr_code = $1 AND ds.status = 'stored'`,
      [qr_code]
    );

    if (sample.rows.length === 0) {
      return res.status(404).json({ error: 'Muestra no encontrada o ya despachada' });
    }

    await query(
      'UPDATE dispensed_samples SET status = $1 WHERE id = $2',
      ['dispatched', sample.rows[0].id]
    );

    await query(
      `INSERT INTO movements (sample_id, sample_type, action_type, user_id, details) 
       VALUES ($1, 'dispensed', 'dispatched', $2, $3)`,
      [sample.rows[0].id, req.user.id, JSON.stringify({ qr_code, lot: sample.rows[0].lot })]
    );

    res.json({
      message: 'Despacho confirmado',
      sample: sample.rows[0]
    });
  } catch (error) {
    console.error('Error al despachar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/fefo/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;

    const result = await query(
      `SELECT ds.*, gs.name, gs.lot, gs.expiration_date, gs.provider, s.name as shelf_name
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       LEFT JOIN shelves s ON ds.shelf_id = s.id
       WHERE gs.name ILIKE $1 AND ds.status = 'stored'
       ORDER BY gs.expiration_date ASC`,
      [`%${name}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error en búsqueda FEFO:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
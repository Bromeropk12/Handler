import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { market_line_id, search } = req.query;
    let sql = `
      SELECT gs.*, ml.name as market_line_name 
      FROM global_samples gs
      LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
      WHERE 1=1
    `;
    const params = [];

    if (market_line_id) {
      params.push(market_line_id);
      sql += ` AND gs.market_line_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (gs.name ILIKE $${params.length} OR gs.provider ILIKE $${params.length} OR gs.lot ILIKE $${params.length})`;
    }

    sql += ' ORDER BY gs.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener muestras globales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT gs.*, ml.name as market_line_name 
       FROM global_samples gs
       LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
       WHERE gs.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Muestra global no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener muestra global:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      name, provider, lot, manufacture_date, expiration_date, 
      total_weight_grams, ghs_danger_class, market_line_id, dimensions 
    } = req.body;

    if (!name || !provider || !lot || !manufacture_date || !expiration_date || !total_weight_grams || !market_line_id) {
      return res.status(400).json({ error: 'Todos los campos requeridos deben ser proporcionados' });
    }

    const result = await query(
      `INSERT INTO global_samples 
       (name, provider, lot, manufacture_date, expiration_date, total_weight_grams, ghs_danger_class, market_line_id, dimensions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, provider, lot, manufacture_date, expiration_date, total_weight_grams, ghs_danger_class, market_line_id, dimensions || '1x1']
    );

    await query(
      `INSERT INTO movements (sample_id, sample_type, action_type, user_id, details) 
       VALUES ($1, 'global', 'created', $2, $3)`,
      [result.rows[0].id, req.user.id, JSON.stringify({ name, lot })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear muestra global:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, provider, lot, manufacture_date, expiration_date, 
      total_weight_grams, ghs_danger_class, market_line_id, dimensions 
    } = req.body;

    const result = await query(
      `UPDATE global_samples 
       SET name = $1, provider = $2, lot = $3, manufacture_date = $4, expiration_date = $5, 
           total_weight_grams = $6, ghs_danger_class = $7, market_line_id = $8, dimensions = $9
       WHERE id = $10 
       RETURNING *`,
      [name, provider, lot, manufacture_date, expiration_date, total_weight_grams, ghs_danger_class, market_line_id, dimensions, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Muestra global no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar muestra global:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const checkDispensed = await query(
      'SELECT COUNT(*) as count FROM dispensed_samples WHERE global_sample_id = $1 AND status = $2',
      [id, 'stored']
    );

    if (parseInt(checkDispensed.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: hay muestras dispensadas activas' });
    }

    const result = await query('DELETE FROM global_samples WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Muestra global no encontrada' });
    }

    res.json({ message: 'Muestra global eliminada' });
  } catch (error) {
    console.error('Error al eliminar muestra global:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
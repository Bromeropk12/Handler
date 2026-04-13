import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { market_line_id } = req.query;
    let sql = 'SELECT * FROM shelves';
    let params = [];

    if (market_line_id) {
      sql += ' WHERE market_line_id = $1';
      params = [market_line_id];
    }

    sql += ' ORDER BY name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener anaqueles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM shelves WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anaquel no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener anaquel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { market_line_id, name, total_capacity } = req.body;

    if (!market_line_id || !name) {
      return res.status(400).json({ error: 'Línea de mercado y nombre son requeridos' });
    }

    const result = await query(
      'INSERT INTO shelves (market_line_id, name, total_capacity) VALUES ($1, $2, $3) RETURNING *',
      [market_line_id, name, total_capacity || 100]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear anaquel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { market_line_id, name, total_capacity } = req.body;

    const result = await query(
      'UPDATE shelves SET market_line_id = $1, name = $2, total_capacity = $3 WHERE id = $4 RETURNING *',
      [market_line_id, name, total_capacity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anaquel no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar anaquel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM shelves WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anaquel no encontrado' });
    }

    res.json({ message: 'Anaquel eliminado' });
  } catch (error) {
    console.error('Error al eliminar anaquel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
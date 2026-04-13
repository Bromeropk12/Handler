import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM market_lines ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener líneas de mercado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      'INSERT INTO market_lines (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear línea de mercado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      'UPDATE market_lines SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Línea de mercado no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar línea de mercado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM market_lines WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Línea de mercado no encontrada' });
    }

    res.json({ message: 'Línea de mercado eliminada' });
  } catch (error) {
    console.error('Error al eliminar línea de mercado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { sample_id, user_id, limit = 100 } = req.query;
    let sql = `
      SELECT m.*, u.username 
      FROM movements m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (sample_id) {
      params.push(sample_id);
      sql += ` AND m.sample_id = $${params.length}`;
    }

    if (user_id) {
      params.push(user_id);
      sql += ` AND m.user_id = $${params.length}`;
    }

    sql += ` ORDER BY m.timestamp DESC LIMIT ${parseInt(limit)}`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalMovements = await query('SELECT COUNT(*) as count FROM movements');
    
    const byAction = await query(`
      SELECT action_type, COUNT(*) as count 
      FROM movements 
      GROUP BY action_type
    `);

    const recentDays = await query(`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM movements
      WHERE timestamp > NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);

    res.json({
      total: parseInt(totalMovements.rows[0].count),
      byAction: byAction.rows,
      recentDays: recentDays.rows
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
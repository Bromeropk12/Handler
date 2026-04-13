import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/recovery', async (req, res) => {
  try {
    const { username, secretPassword, newPassword, confirmPassword } = req.body;

    if (!username || !secretPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const result = await query(
      'SELECT id, secret_password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    
    if (!user.secret_password_hash) {
      return res.status(400).json({ error: 'El usuario no tiene configurada una contraseña secreta' });
    }

    const validSecret = await bcrypt.compare(secretPassword, user.secret_password_hash);

    if (!validSecret) {
      return res.status(401).json({ error: 'Contraseña secreta incorrecta' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, user.id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en recuperación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, secretPassword, role } = req.body;

    if (!username || !password || !secretPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const secretPasswordHash = await bcrypt.hash(secretPassword, 10);

    const result = await query(
      'INSERT INTO users (username, password_hash, secret_password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
      [username, passwordHash, secretPasswordHash, role || 'operator']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
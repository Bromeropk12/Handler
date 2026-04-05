const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

const getSuppliers = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json({
      success: true,
      data: {
        suppliers: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, market_lines, phone, email, address } = req.body;
    if (!name) throw new AppError('El nombre es requerido', 400);

    const existing = await query('SELECT id FROM suppliers WHERE name = $1', [name]);
    if (existing.rows.length > 0) throw new AppError('El proveedor ya existe', 409);

    const result = await query(
      'INSERT INTO suppliers (name, market_lines, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, market_lines, phone, email, address]
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor creado',
      data: { supplier: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, market_lines, phone, email, address } = req.body;
    
    if (!name) throw new AppError('El nombre es requerido', 400);

    const result = await query(
      'UPDATE suppliers SET name=$1, market_lines=$2, phone=$3, email=$4, address=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *',
      [name, market_lines, phone, email, address, id]
    );

    if (result.rows.length === 0) throw new AppError('Proveedor no encontrado', 404);

    res.json({
      success: true,
      message: 'Proveedor actualizado',
      data: { supplier: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const references = await query('SELECT id FROM global_samples WHERE supplier_id = $1 LIMIT 1', [id]);
    if (references.rows.length > 0) {
      throw new AppError('No se puede eliminar porque tiene muestras asociadas', 400);
    }

    const result = await query('DELETE FROM suppliers WHERE id = $1', [id]);
    if (result.rowCount === 0) throw new AppError('Proveedor no encontrado', 404);

    res.json({
      success: true,
      message: 'Proveedor eliminado'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};

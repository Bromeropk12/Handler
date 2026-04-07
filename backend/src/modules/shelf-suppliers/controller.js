/**
 * Shelf Suppliers Controller
 * Gestión de relación many-to-many entre anaqueles y proveedores
 */

const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

/**
 * GET /api/shelf-suppliers/shelf/:shelfId
 * Obtener proveedores de un anaquel
 */
const getShelfSuppliers = async (req, res, next) => {
  try {
    const { shelfId } = req.params;

    const result = await query(`
      SELECT 
        ss.id,
        ss.shelf_id,
        ss.supplier_id,
        ss.is_primary,
        s.name as supplier_name,
        s.market_lines,
        s.phone,
        s.email
      FROM shelf_suppliers ss
      JOIN suppliers s ON ss.supplier_id = s.id
      WHERE ss.shelf_id = $1
      ORDER BY ss.is_primary DESC, s.name ASC
    `, [shelfId]);

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

/**
 * POST /api/shelf-suppliers
 * Vincular proveedor a anaquel
 */
const addShelfSupplier = async (req, res, next) => {
  try {
    const { shelf_id, supplier_id, is_primary = false } = req.body;

    if (!shelf_id || !supplier_id) {
      throw new AppError('shelf_id y supplier_id son requeridos', 400);
    }

    // Verificar que el anaquel existe
    const shelf = await query('SELECT id FROM shelves WHERE id = $1', [shelf_id]);
    if (shelf.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    // Verificar que el proveedor existe
    const supplier = await query('SELECT id FROM suppliers WHERE id = $1', [supplier_id]);
    if (supplier.rows.length === 0) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    // Si es primary, desmarcar otros primary del mismo anaquel
    if (is_primary) {
      await query('UPDATE shelf_suppliers SET is_primary = false WHERE shelf_id = $1', [shelf_id]);
    }

    const result = await query(
      'INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary) VALUES ($1, $2, $3) RETURNING *',
      [shelf_id, supplier_id, is_primary]
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor vinculado al anaquel exitosamente',
      data: {
        shelfSupplier: result.rows[0]
      }
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Este proveedor ya está vinculado a este anaquel', 409);
    }
    next(error);
  }
};

/**
 * PUT /api/shelf-suppliers/:id
 * Actualizar proveedor principal de un anaquel
 */
const updateShelfSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_primary } = req.body;

    const existing = await query('SELECT shelf_id FROM shelf_suppliers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Relación no encontrada', 404);
    }

    if (is_primary) {
      await query('UPDATE shelf_suppliers SET is_primary = false WHERE shelf_id = $1', [existing.rows[0].shelf_id]);
    }

    const result = await query(
      'UPDATE shelf_suppliers SET is_primary = $1 WHERE id = $2 RETURNING *',
      [is_primary, id]
    );

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: {
        shelfSupplier: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/shelf-suppliers/:id
 * Desvincular proveedor de anaquel
 */
const removeShelfSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM shelf_suppliers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Relación no encontrada', 404);
    }

    res.json({
      success: true,
      message: 'Proveedor desvinculado del anaquel exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShelfSuppliers,
  addShelfSupplier,
  updateShelfSupplier,
  removeShelfSupplier
};
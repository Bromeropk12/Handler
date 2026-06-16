const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const path = require('path');
const fs = require('fs').promises;

const getSuppliers = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM global_samples gs WHERE gs.supplier_id = s.id) as sample_count
      FROM suppliers s
      ORDER BY name ASC
    `);

    // Construir URL completa del logo para el frontend
    const suppliers = result.rows.map(s => ({
      ...s,
      logo_url: s.logo_path ? `/${s.logo_path}` : null
    }));

    res.json({
      success: true,
      data: { suppliers }
    });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, market_lines, phone, email, address } = req.body;
    if (!name) throw new AppError('El nombre es requerido', 400);

    const tx = await transaction();
    try {
      const existing = await tx.query('SELECT id FROM suppliers WHERE name = $1', [name]);
      if (existing.rows.length > 0) {
        await tx.rollback();
        return next(new AppError('El proveedor ya existe', 409));
      }

      const result = await tx.query(
        'INSERT INTO suppliers (name, market_lines, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, market_lines, phone, email, address]
      );

      await tx.commit();

      res.status(201).json({
        success: true,
        message: 'Proveedor creado',
        data: { supplier: result.rows[0] }
      });
    } catch (txError) {
      await tx.rollback();
      return next(txError);
    }
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

    const tx = await transaction();
    try {
      const references = await tx.query('SELECT id FROM global_samples WHERE supplier_id = $1 LIMIT 1', [id]);
      if (references.rows.length > 0) {
        await tx.rollback();
        return next(new AppError('No se puede eliminar porque tiene muestras asociadas', 400));
      }

      const result = await tx.query('DELETE FROM suppliers WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        await tx.rollback();
        return next(new AppError('Proveedor no encontrado', 404));
      }

      await tx.commit();

      res.json({
        success: true,
        message: 'Proveedor eliminado'
      });
    } catch (txError) {
      await tx.rollback();
      return next(txError);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Upload logo PNG para un proveedor
 * POST /api/suppliers/:id/logo
 */
const uploadSupplierLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw new AppError('Se requiere un archivo PNG de logo', 400);
    }

    // Verificar que el proveedor existe
    const supplier = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (supplier.rows.length === 0) {
      // Limpiar archivo subido
      try { await fs.unlink(req.file.path); } catch (_) {}
      throw new AppError('Proveedor no encontrado', 404);
    }

    // Si tenía un logo previo en uploads/, eliminarlo
    const oldLogo = supplier.rows[0].logo_path;
    if (oldLogo && oldLogo.startsWith('uploads/')) {
      try {
        await fs.unlink(path.join(process.cwd(), oldLogo));
      } catch (_) {}
    }

    // Guardar ruta relativa
    const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');

    await query(
      'UPDATE suppliers SET logo_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [relativePath, id]
    );

    res.json({
      success: true,
      message: 'Logo actualizado exitosamente',
      data: {
        logo_path: relativePath,
        logo_url: `/${relativePath}`
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  uploadSupplierLogo
};

const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Subdividir un Bulk Sample en Muestras Hijas (Dispensación Genérica)
 */
const subdivideBulkSample = async (req, res, next) => {
  try {
    const { global_sample_id, number_of_units } = req.body;
    
    if (!global_sample_id) throw new AppError('El ID del Bulk Sample es requerido', 400);
    if (!number_of_units || number_of_units <= 0) throw new AppError('El número de unidades debe ser mayor a 0', 400);

    const bulkCheck = await query('SELECT id, name, lot, total_units FROM global_samples WHERE id = $1', [global_sample_id]);
    if (bulkCheck.rows.length === 0) throw new AppError('Muestra global no encontrada', 404);
    
    const bulk = bulkCheck.rows[0];

    // Verificar si ya se subdividió previamente o sumar. 
    // Para no complicarlo en exceso o si permite multiples dispensaciones, sumamos las unidades.
    const newTotal = bulk.total_units + parseInt(number_of_units, 10);

    const txQueries = [];

    // Actualizar padre
    txQueries.push({
      query: 'UPDATE global_samples SET total_units = $1, available_units = available_units + $2 WHERE id = $3',
      params: [newTotal, number_of_units, global_sample_id]
    });

    // Crear hijos
    const generatedChildren = [];
    for(let i = 0; i < number_of_units; i++) {
        // Para que sean únicos, usamos un Date.now más random
        const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
        const qrCode = `SYS-CH-${bulk.lot}-${Date.now().toString().slice(-4)}${uniqueNumber}`;
        generatedChildren.push(qrCode);
        
        txQueries.push({
          query: `INSERT INTO child_samples (qr_code, global_sample_id, status) VALUES ($1, $2, 'available')`,
          params: [qrCode, global_sample_id]
        });
    }

    // Movimiento
    txQueries.push({
      query: `INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)`,
      params: [
          global_sample_id, 'dispensed', req.user.id,
          JSON.stringify({ type: 'subdivided', amount_generated: number_of_units })
      ]
    });

    await transaction(txQueries);

    res.json({
      success: true,
      message: `Se han dispensado exitosamente ${number_of_units} unidades hijas.`,
      data: {
        generated_qr_codes: generatedChildren
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  subdivideBulkSample
};
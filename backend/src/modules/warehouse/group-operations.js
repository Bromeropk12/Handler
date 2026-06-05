/**
 * Group Operations Module - 3D
 *
 * Lógica de previsualización y commit de movimientos GRUPALES
 * (drag-en-grupo) en el almacén 3D.
 *
 * Garantías:
 *  - Las N muestras de un grupo tienen el mismo `global_sample_id`
 *    (validación `validateGroupType` defense-in-depth).
 *  - La forma del grupo se conserva (traslación rígida): cada muestra
 *    mantiene su offset relativo respecto al anchor.
 *  - El commit es atómico: BEGIN/COMMIT/ROLLBACK. Si falla UN solo
 *    UPDATE, se hace ROLLBACK de TODOS.
 *  - El log de movimientos se inserta DENTRO de la transacción, con
 *    `batch_id` UUID compartido por todas las N entries.
 *
 * @see Plan_movimientos.md §4
 */

const crypto = require('crypto');
const { AppError } = require('../../middleware/errorHandler');
const { areCompatible, getMinimumDistance } = require('../../utils/sga-compatibility');

// ──────────────────────────────────────────────────────────────────────
//  CONSTANTES
// ──────────────────────────────────────────────────────────────────────

const MAX_GROUP_SIZE = 10;

// Distancia Manhattan mínima para que dos muestras se consideren
// "vecinas" en la validación SGA. Heredado de validations.js::getNeighbors.
const NEIGHBOR_RADIUS = 3;

// ──────────────────────────────────────────────────────────────────────
//  HELPERS DE GEOMETRÍA
// ──────────────────────────────────────────────────────────────────────

/**
 * Verifica si dos AABBs se superponen en 3D.
 * @param {{x:number,y:number,z:number,w:number,h:number,d:number}} a
 * @param {{x:number,y:number,z:number,w:number,h:number,d:number}} b
 */
function boxesOverlap(a, b) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y ||
    a.z + a.d <= b.z ||
    b.z + b.d <= a.z
  );
}

/**
 * Distancia Manhattan entre dos posiciones (origen de la celda).
 */
function manhattan(ax, ay, az, bx, by, bz) {
  return Math.abs(ax - bx) + Math.abs(ay - by) + Math.abs(az - bz);
}

// ──────────────────────────────────────────────────────────────────────
//  getNeighborsByAABB
//
//  Lógica movida desde validations.js::getNeighbors, expuesta como
//  helper reutilizable tanto por `validatePlacement` (single) como
//  por `previewGroupPlacement` (group) y `commitGroupMove`.
// ──────────────────────────────────────────────────────────────────────

/**
 * Filtra una lista de muestras a las que están dentro del radio Manhattan
 * de un AABB dado. Usado para validación SGA: solo los vecinos cercanos
 * requieren chequeo de compatibilidad.
 *
 * @param {{x:number,y:number,z:number,w:number,h:number,d:number}} aabb
 *        El AABB candidato.
 * @param {Array<{position_x:number,position_y:number,position_z:number,
 *                width:number,height:number,depth:number,ghs_danger_class:string,
 *                id?:string}>} allSamples
 *        Muestras externas a chequear (no incluye las del grupo).
 * @param {number} [radius=3]
 *        Radio Manhattan.
 * @returns {Array} Subset de allSamples que está dentro del radio.
 */
function getNeighborsByAABB(aabb, allSamples, radius = NEIGHBOR_RADIUS) {
  const out = [];
  for (const s of allSamples) {
    const sx = s.position_x;
    const sy = s.position_y;
    const sz = s.position_z;
    if (sx === null || sy === null || sz === null) continue;

    // Distancia Manhattan entre el origen del AABB y el origen de la muestra.
    // Si esa distancia es 0 o excede el radio + max(w,h,d), no es vecina.
    const dist = manhattan(aabb.x, aabb.y, aabb.z, sx, sy, sz);
    if (dist === 0) continue; // misma celda (no debería pasar)
    if (dist > radius) continue;

    // Verificación adicional: ¿se tocan sus AABBs (con padding)?
    // Esto cubre el caso de muestras grandes cuya "sombra" se acerca
    // aunque su origen esté lejos.
    const sAabb = {
      x: sx,
      y: sy,
      z: sz,
      w: s.width || 1,
      h: s.height || 1,
      d: s.depth || 1,
    };
    // Padding del radio
    const paddedAabb = {
      x: aabb.x - radius,
      y: aabb.y - radius,
      z: aabb.z - radius,
      w: aabb.w + radius * 2,
      h: aabb.h + radius * 2,
      d: aabb.d + radius * 2,
    };
    if (boxesOverlap(paddedAabb, sAabb)) {
      out.push(s);
    }
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────
//  validateGroupType
//
//  Defense-in-depth: el frontend ya garantiza mismo `global_sample_id`
//  para los grupos, pero el backend también lo verifica. Si por algún
//  bug del cliente se mezclan tipos, el backend rechaza con 400.
// ──────────────────────────────────────────────────────────────────────

/**
 * Verifica que todas las muestras del grupo compartan el mismo
 * `global_sample_id` (mismo producto / lote). Si no, lanza 400.
 *
 * @param {string[]} sampleIds
 * @param {{query:Function}} db
 * @returns {Promise<{id:string,name:string,lot:string,ghs_danger_class:string,
 *                     width:number,height:number,depth:number,
 *                     position_x:number,position_y:number,position_z:number,
 *                     shelf_id:string}>} Muestra "anchor" (la primera).
 * @throws {AppError} 400 si los tipos no coinciden, 404 si falta alguna muestra.
 */
async function validateGroupType(sampleIds, db) {
  if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
    throw new AppError('Se requiere un array no-vacío de sample_ids', 400);
  }
  if (sampleIds.length > MAX_GROUP_SIZE) {
    throw new AppError(
      `Máximo ${MAX_GROUP_SIZE} muestras por grupo (recibidas: ${sampleIds.length})`,
      400
    );
  }

  // IDs únicos para evitar duplicados
  const uniqueIds = [...new Set(sampleIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new AppError('sample_ids contiene solo valores vacíos', 400);
  }

  // Cargar las muestras con JOIN a global_samples para tener SGA + dims
  const result = await db.query(
    `
    SELECT
      ds.id, ds.global_sample_id, ds.shelf_id,
      ds.position_x, ds.position_y, ds.position_z,
      ds.width, ds.height, ds.depth, ds.status,
      gs.name as global_sample_name, gs.lot, gs.ghs_danger_class
    FROM dispensed_samples ds
    JOIN global_samples gs ON ds.global_sample_id = gs.id
    WHERE ds.id = ANY($1::uuid[])
  `,
    [uniqueIds]
  );

  if (result.rows.length !== uniqueIds.length) {
    const found = new Set(result.rows.map((r) => r.id));
    const missing = uniqueIds.filter((id) => !found.has(id));
    throw new AppError(
      `Muestras no encontradas: ${missing.join(', ')}`,
      404
    );
  }

  const samples = result.rows;

  // 1. Verificar que todas estén 'stored'
  for (const s of samples) {
    if (s.status !== 'stored') {
      throw new AppError(
        `La muestra ${s.id} no está 'stored' (status='${s.status}'). ` +
          `Solo se pueden mover muestras almacenadas.`,
        409
      );
    }
  }

  // 2. Verificar mismo `global_sample_id`
  const types = new Set(samples.map((s) => s.global_sample_id));
  if (types.size > 1) {
    const details = samples.map(
      (s) => `${s.global_sample_name} (id=${s.id})`
    );
    throw new AppError(
      `El grupo contiene muestras de productos distintos. ` +
        `Solo se permite arrastrar muestras del mismo tipo. ` +
        `Muestras involucradas: ${details.join(', ')}`,
      400
    );
  }

  // 3. Verificar mismas dimensiones (todas del mismo global + mismo formato)
  const dims = new Set(
    samples.map(
      (s) => `${s.width || 1}x${s.height || 1}x${s.depth || 1}`
    )
  );
  if (dims.size > 1) {
    throw new AppError(
      `El grupo contiene muestras con dimensiones distintas: ${[...dims].join(', ')}. ` +
        `No se puede mover como un bloque rígido.`,
      400
    );
  }

  // 4. Verificar mismo shelf origen (cross-shelf group no permitido en drag-en-grupo;
  //    el usuario debe usar single-move flow si tiene muestras en varios anaqueles)
  const shelves = new Set(samples.map((s) => s.shelf_id));
  if (shelves.size > 1) {
    throw new AppError(
      `El grupo contiene muestras de anaqueles distintos. ` +
        `Mueve primero cada anaquel por separado.`,
      400
    );
  }

  return samples;
}

// ──────────────────────────────────────────────────────────────────────
//  previewGroupPlacement
// ──────────────────────────────────────────────────────────────────────

/**
 * Previsualiza dónde puede caer un grupo de N muestras en el anaquel
 * destino, considerando colisiones AABB con muestras externas y
 * compatibilidad SGA.
 *
 * El "anchor" es la primera muestra del array (la que el usuario agarró).
 * Para cada celda (x, y, z) donde el anchor cabe dentro del shelf,
 * se calcula la posición de cada muestra del grupo y se valida.
 *
 * @param {object} args
 * @param {string} args.shelfId          - (compat) shelf origen
 * @param {string} [args.targetShelfId]  - shelf destino (default: shelfId)
 * @param {string[]} args.sampleIds      - IDs de las muestras del grupo
 * @param {{query:Function}} args.db
 *
 * @returns {Promise<{
 *   groupShape: {globalSampleId:string,name:string,lot:string,
 *                dangerClass:string,width:number,height:number,depth:number,
 *                anchorSample:{id:string,position_x:number,position_y:number,position_z:number},
 *                offsets:Array<{sampleId:string,dx:number,dy:number,dz:number}>},
 *   targetShelf: {id:string,name:string,grid_width:number,grid_height:number,shelf_depth:number,
 *                 market_line_id:string},
 *   cells: Array<{x:number,y:number,z:number,compatible:boolean,
 *                 conflicts:Array<{sampleId:string,dangerClass:string,reason:string}>}>,
 *   validCount: number,
 *   invalidCount: number,
 *   totalCandidates: number
 * }>}
 */
async function previewGroupPlacement({ shelfId, targetShelfId, sampleIds, db }) {
  const finalTargetId = targetShelfId || shelfId;

  // 1) Cargar y validar el grupo
  const groupSamples = await validateGroupType(sampleIds, db);

  // 2) Cargar shelf destino
  const shelfResult = await db.query(
    `SELECT id, name, grid_width, grid_height, shelf_depth, market_line_id
     FROM shelves WHERE id = $1`,
    [finalTargetId]
  );
  if (shelfResult.rows.length === 0) {
    throw new AppError(`Anaquel destino ${finalTargetId} no encontrado`, 404);
  }
  const targetShelf = shelfResult.rows[0];

  // 3) Si es cross-shelf, validar misma línea de mercado
  if (finalTargetId !== shelfId) {
    const sourceShelf = await db.query(
      `SELECT market_line_id FROM shelves WHERE id = $1`,
      [shelfId]
    );
    if (
      sourceShelf.rows.length > 0 &&
      sourceShelf.rows[0].market_line_id !== targetShelf.market_line_id
    ) {
      throw new AppError(
        'Solo se permiten movimientos dentro de la misma línea de mercado',
        400
      );
    }
  }

  // 4) Cargar muestras externas en el shelf destino
  const externalResult = await db.query(
    `
    SELECT ds.id, ds.position_x, ds.position_y, ds.position_z,
           ds.width, ds.height, ds.depth, ds.status,
           gs.ghs_danger_class
    FROM dispensed_samples ds
    JOIN global_samples gs ON ds.global_sample_id = gs.id
    WHERE ds.shelf_id = $1
      AND ds.status = 'stored'
      AND ds.position_x IS NOT NULL
      AND ds.position_y IS NOT NULL
      AND ds.position_z IS NOT NULL
      ${finalTargetId === shelfId ? `AND NOT (ds.id = ANY($2::uuid[]))` : ''}
  `,
    finalTargetId === shelfId ? [finalTargetId, sampleIds] : [finalTargetId]
  );
  const externalSamples = externalResult.rows;

  // 5) Datos del grupo
  const anchor = groupSamples[0];
  const groupDangerClass = anchor.ghs_danger_class;
  const sampleWidth = anchor.width || 1;
  const sampleHeight = anchor.height || 1;
  const sampleDepth = anchor.depth || 1;

  // Offsets relativos al anchor
  const offsets = groupSamples.map((s) => ({
    sampleId: s.id,
    dx: (s.position_x || 0) - (anchor.position_x || 0),
    dy: (s.position_y || 0) - (anchor.position_y || 0),
    dz: (s.position_z || 0) - (anchor.position_z || 0),
  }));

  // 6) Iterar todas las celdas del target donde el anchor cabe
  const gridWidth = targetShelf.grid_width || 10;
  const gridHeight = targetShelf.grid_height || 10;
  const shelfDepth = targetShelf.shelf_depth || 10;

  const cells = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let y = 0; y <= gridHeight - sampleHeight; y++) {
    for (let z = 0; z <= shelfDepth - sampleDepth; z++) {
      for (let x = 0; x <= gridWidth - sampleWidth; x++) {
        // Calcular AABB de cada muestra del grupo en la posición candidata
        const groupAABBs = offsets.map((o) => ({
          sampleId: o.sampleId,
          x: x + o.dx,
          y: y + o.dy,
          z: z + o.dz,
          w: sampleWidth,
          h: sampleHeight,
          d: sampleDepth,
        }));

        // Salirse del shelf → descartar (no es candidato)
        if (
          groupAABBs.some(
            (a) =>
              a.x < 0 ||
              a.y < 0 ||
              a.z < 0 ||
              a.x + a.w > gridWidth ||
              a.y + a.h > gridHeight ||
              a.z + a.d > shelfDepth
          )
        ) {
          continue;
        }

        // Colisión AABB con muestras externas
        const conflicts = [];
        let compatible = true;
        for (const aabb of groupAABBs) {
          for (const ext of externalSamples) {
            const extAabb = {
              x: ext.position_x,
              y: ext.position_y,
              z: ext.position_z,
              w: ext.width || 1,
              h: ext.height || 1,
              d: ext.depth || 1,
            };
            if (boxesOverlap(aabb, extAabb)) {
              compatible = false;
              conflicts.push({
                sampleId: ext.id,
                dangerClass: ext.ghs_danger_class,
                reason: 'Colisión física: la celda está ocupada',
              });
              continue;
            }
            // SGA: solo si es vecino Manhattan
            const dist = manhattan(
              aabb.x,
              aabb.y,
              aabb.z,
              ext.position_x,
              ext.position_y,
              ext.position_z
            );
            if (dist > 0 && dist <= NEIGHBOR_RADIUS) {
              if (!areCompatible(groupDangerClass, ext.ghs_danger_class)) {
                compatible = false;
                conflicts.push({
                  sampleId: ext.id,
                  dangerClass: ext.ghs_danger_class,
                  reason: `Incompatibilidad SGA: ${groupDangerClass} no puede estar junto a ${ext.ghs_danger_class}`,
                });
              }
            }
          }
        }

        cells.push({
          x,
          y,
          z,
          compatible,
          conflicts: [...new Map(conflicts.map((c) => [c.sampleId + ':' + c.reason, c])).values()],
        });
        if (compatible) validCount++;
        else invalidCount++;
      }
    }
  }

  return {
    groupShape: {
      globalSampleId: anchor.global_sample_id,
      name: anchor.global_sample_name,
      lot: anchor.lot,
      dangerClass: groupDangerClass,
      width: sampleWidth,
      height: sampleHeight,
      depth: sampleDepth,
      anchorSample: {
        id: anchor.id,
        position_x: anchor.position_x,
        position_y: anchor.position_y,
        position_z: anchor.position_z,
      },
      offsets,
    },
    targetShelf: {
      id: targetShelf.id,
      name: targetShelf.name,
      grid_width: gridWidth,
      grid_height: gridHeight,
      shelf_depth: shelfDepth,
      market_line_id: targetShelf.market_line_id,
    },
    cells,
    validCount,
    invalidCount,
    totalCandidates: cells.length,
  };
}

// ──────────────────────────────────────────────────────────────────────
//  commitGroupMove  (TRANSACCIONAL)
// ──────────────────────────────────────────────────────────────────────

/**
 * Mueve N muestras en una sola transacción PostgreSQL.
 * - Valida tipos (defense-in-depth).
 * - Re-valida placement de cada muestra (concurrent safety: WHERE
 *   status='stored' AND position_x=old_x, etc.).
 * - INSERT en `movements` con `batch_id` compartido, DENTRO del BEGIN.
 * - ROLLBACK total si algo falla.
 *
 * @param {object} args
 * @param {string} args.sourceShelfId
 * @param {string} args.targetShelfId
 * @param {Array<{sample_id:string,new_position_x:number,new_position_y:number,new_position_z:number}>} args.sampleMoves
 * @param {string} args.userId
 * @param {{query:Function,pool:Object}} args.db
 *
 * @returns {Promise<{batchId:string,moved:Array,movements:number}>}
 */
async function commitGroupMove({
  sourceShelfId,
  targetShelfId,
  sampleMoves,
  userId,
  db,
}) {
  if (!Array.isArray(sampleMoves) || sampleMoves.length === 0) {
    throw new AppError('Se requiere un array no-vacío de moves', 400);
  }
  if (sampleMoves.length > MAX_GROUP_SIZE) {
    throw new AppError(
      `Máximo ${MAX_GROUP_SIZE} moves por commit (recibidos: ${sampleMoves.length})`,
      400
    );
  }

  const finalTargetId = targetShelfId || sourceShelfId;
  const sampleIds = sampleMoves.map((m) => m.sample_id);

  // 1) Validar grupo (tipos, status, dimensiones, mismo shelf origen)
  const groupSamples = await validateGroupType(sampleIds, db);
  const sampleMap = new Map(groupSamples.map((s) => [s.id, s]));

  // 2) Generar batch_id
  const batchId = crypto.randomUUID();

  // 3) Abrir conexión dedicada para transacción
  const client = await db.pool.connect();
  const moved = [];
  const movements = [];

  try {
    await client.query('BEGIN');

    // 4) Validar y actualizar CADA muestra
    for (const move of sampleMoves) {
      const sample = sampleMap.get(move.sample_id);
      if (!sample) {
        throw new AppError(
          `Muestra ${move.sample_id} no encontrada en el grupo cargado`,
          404
        );
      }

      // Verificar que el move coincide con el sample
      if (move.new_position_x === undefined ||
          move.new_position_y === undefined ||
          move.new_position_z === undefined) {
        throw new AppError(
          `Move incompleto para ${move.sample_id}: requiere new_position_x, _y, _z`,
          400
        );
      }

      // Posiciones de origen (snapshot al inicio del grupo)
      const oldX = sample.position_x;
      const oldY = sample.position_y;
      const oldZ = sample.position_z;

      // Limites del shelf destino
      const shelfQ = await client.query(
        `SELECT grid_width, grid_height, shelf_depth FROM shelves WHERE id = $1`,
        [finalTargetId]
      );
      if (shelfQ.rows.length === 0) {
        throw new AppError(`Anaquel destino ${finalTargetId} no encontrado`, 404);
      }
      const sh = shelfQ.rows[0];
      const w = sample.width || 1;
      const h = sample.height || 1;
      const d = sample.depth || 1;
      if (
        move.new_position_x < 0 ||
        move.new_position_y < 0 ||
        move.new_position_z < 0 ||
        move.new_position_x + w > sh.grid_width ||
        move.new_position_y + h > sh.grid_height ||
        move.new_position_z + d > sh.shelf_depth
      ) {
        throw new AppError(
          `La posición (${move.new_position_x},${move.new_position_y},${move.new_position_z}) ` +
            `excede los límites del anaquel destino`,
          400
        );
      }

      // AABB collision check contra el resto del grupo y externas (en la misma tx)
      // Otras muestras del grupo: sus posiciones ORIGINALES están en `oldX/oldY/oldZ`
      // pero al final del commit todas tendrán nuevas posiciones. Validamos
      // contra el ESTADO FINAL (todas las nuevas posiciones de las moves previas).
      const finalPositions = moved.map((m) => ({
        x: m.new_position.x,
        y: m.new_position.y,
        z: m.new_position.z,
        w: m.width || 1,
        h: m.height || 1,
        d: m.depth || 1,
      }));
      // Auto-colisión: la misma muestra comparada consigo misma. Filtrar:
      const candidates = finalPositions; // todas las moves anteriores
      for (const other of candidates) {
        if (
          boxesOverlap(
            { x: move.new_position_x, y: move.new_position_y, z: move.new_position_z, w, h, d },
            other
          )
        ) {
          throw new AppError(
            `Colisión interna del grupo: la muestra ${move.sample_id} ` +
              `se superpone con otra move ya procesada en (${other.x},${other.y},${other.z})`,
            400
          );
        }
      }

      // Muestras externas en el target shelf (excluyendo las del grupo)
      const otherResult = await client.query(
        `
        SELECT id, position_x, position_y, position_z, width, height, depth
        FROM dispensed_samples
        WHERE shelf_id = $1
          AND status = 'stored'
          AND position_x IS NOT NULL
          AND NOT (id = ANY($2::uuid[]))
      `,
        [finalTargetId, sampleIds]
      );
      for (const other of otherResult.rows) {
        if (
          boxesOverlap(
            { x: move.new_position_x, y: move.new_position_y, z: move.new_position_z, w, h, d },
            {
              x: other.position_x,
              y: other.position_y,
              z: other.position_z,
              w: other.width || 1,
              h: other.height || 1,
              d: other.depth || 1,
            }
          )
        ) {
          throw new AppError(
            `Colisión con muestra externa ${other.id} en ` +
              `(${other.position_x},${other.position_y},${other.position_z})`,
            400
          );
        }
      }

      // SGA: solo si target ≠ source (en mismo shelf no se reevalúa SGA, no hay nuevos vecinos)
      // Pero si es cross-shelf O si las nuevas posiciones las acercan a nuevas
      // muestras, hay que validar. Por simplicidad y seguridad, validamos siempre.
      // (Igual que en validatePlacement.)
      const neighborsResult = await client.query(
        `
        SELECT id, ghs_danger_class, position_x, position_y, position_z
        FROM dispensed_samples ds
        JOIN global_samples gs ON ds.global_sample_id = gs.id
        WHERE ds.shelf_id = $1
          AND ds.status = 'stored'
          AND ds.position_x IS NOT NULL
          AND ds.position_y IS NOT NULL
          AND ds.position_z IS NOT NULL
          AND ds.id != ALL($2::uuid[])
          AND ds.position_x BETWEEN $3 - 4 AND $3 + 4
          AND ds.position_y BETWEEN $4 - 4 AND $4 + 4
          AND ds.position_z BETWEEN $5 - 4 AND $5 + 4
      `,
        [finalTargetId, [move.sample_id], move.new_position_x, move.new_position_y, move.new_position_z]
      );
      for (const n of neighborsResult.rows) {
        const dist = manhattan(
          move.new_position_x,
          move.new_position_y,
          move.new_position_z,
          n.position_x,
          n.position_y,
          n.position_z
        );
        if (dist > 0 && dist <= NEIGHBOR_RADIUS) {
          if (!areCompatible(sample.ghs_danger_class, n.ghs_danger_class)) {
            throw new AppError(
              `Incompatibilidad SGA en commit grupal: ${sample.ghs_danger_class} no puede ` +
                `estar junto a ${n.ghs_danger_class} (vecino ${n.id})`,
              400
            );
          }
        }
      }

      // UPDATE con WHERE concurrencia-safe
      const updateResult = await client.query(
        `
        UPDATE dispensed_samples
        SET shelf_id = $1, position_x = $2, position_y = $3, position_z = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
          AND status = 'stored'
          AND position_x = $6 AND position_y = $7 AND position_z = $8
          AND shelf_id = $9
        RETURNING id
      `,
        [
          finalTargetId,
          move.new_position_x,
          move.new_position_y,
          move.new_position_z,
          move.sample_id,
          oldX,
          oldY,
          oldZ,
          sourceShelfId,
        ]
      );

      if (updateResult.rowCount === 0) {
        // La muestra cambió de estado o posición mientras procesábamos (otro user).
        throw new AppError(
          `La muestra ${move.sample_id} ya no está en ` +
            `(${oldX},${oldY},${oldZ}) del anaquel ${sourceShelfId}. ` +
            `Otro usuario pudo haberla movido. Recarga el mapa.`,
          409
        );
      }

      // INSERT movements DENTRO de la tx, con batch_id compartido
      const movementResult = await client.query(
        `
        INSERT INTO movements (sample_id, action_type, user_id, details, batch_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
        [
          move.sample_id,
          'moved',
          userId,
          JSON.stringify({
            type: 'group_movement',
            from_shelf_id: sourceShelfId,
            to_shelf_id: finalTargetId,
            from_position: { x: oldX, y: oldY, z: oldZ },
            to_position: {
              x: move.new_position_x,
              y: move.new_position_y,
              z: move.new_position_z,
            },
          }),
          batchId,
        ]
      );

      moved.push({
        sample_id: move.sample_id,
        old_position: { x: oldX, y: oldY, z: oldZ },
        new_position: {
          x: move.new_position_x,
          y: move.new_position_y,
          z: move.new_position_z,
        },
        width: w,
        height: h,
        depth: d,
        movement_id: movementResult.rows[0]?.id,
      });
      movements.push(movementResult.rows[0]?.id);
    }

    await client.query('COMMIT');

    return {
      batchId,
      moved,
      movements: movements.filter(Boolean).length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ──────────────────────────────────────────────────────────────────────
//  EXPORTS
// ──────────────────────────────────────────────────────────────────────

module.exports = {
  // Helpers de geometría (exportados para tests)
  boxesOverlap,
  manhattan,
  getNeighborsByAABB,

  // API principal
  validateGroupType,
  previewGroupPlacement,
  commitGroupMove,

  // Constantes (exportadas para tests)
  MAX_GROUP_SIZE,
  NEIGHBOR_RADIUS,
};

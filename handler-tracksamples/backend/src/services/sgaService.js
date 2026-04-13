import { query } from '../db/index.js';

const SGA_CLASSES = {
  'Inflamable': { incompatible: ['Comburente', 'Peróxidos'], compatible: ['Sin Riesgo', 'Irritante'] },
  'Corrosivo': { incompatible: ['Inflamable', 'Tóxico'], compatible: ['Sin Riesgo', 'Irritante'] },
  'Tóxico': { incompatible: ['Corrosivo', 'Comburente'], compatible: ['Sin Riesgo', 'Irritante'] },
  'Comburente': { incompatible: ['Inflamable', 'Tóxico', 'Peróxidos'], compatible: ['Sin Riesgo'] },
  'Irritante': { compatible: ['Inflamable', 'Corrosivo', 'Tóxico', 'Comburente', 'Sin Riesgo', 'Peróxidos'] },
  'Sin Riesgo': { compatible: ['Inflamable', 'Corrosivo', 'Tóxico', 'Comburente', 'Irritante', 'Peróxidos'] },
  'Peróxidos': { incompatible: ['Inflamable', 'Comburente'], compatible: ['Sin Riesgo', 'Irritante'] },
  'Explosivo': { incompatible: ['Inflamable', 'Comburente', 'Peróxidos'], compatible: ['Sin Riesgo'] }
};

export class SGAService {
  static areCompatible(class1, class2) {
    if (!class1 || !class2) return true;
    if (class1 === class2) return true;
    
    const sga1 = SGA_CLASSES[class1];
    const sga2 = SGA_CLASSES[class2];
    
    if (!sga1 || !sga2) return true;
    
    if (sga1.incompatible && sga1.incompatible.includes(class2)) {
      return false;
    }
    
    if (sga2.incompatible && sga2.incompatible.includes(class1)) {
      return false;
    }
    
    return true;
  }

  static getCompatibleClasses(dangerClass) {
    const sga = SGA_CLASSES[dangerClass];
    if (!sga) return ['Sin Riesgo'];
    return sga.compatible || [];
  }

  static getIncompatibleClasses(dangerClass) {
    const sga = SGA_CLASSES[dangerClass];
    if (!sga) return [];
    return sga.incompatible || [];
  }

  static async findAndPlaceSample(sample, width, height, dangerClass, shelves, marketLineId) {
    for (const shelf of shelves) {
      const placement = await this.findPositionInShelf(shelf.id, width, height, dangerClass, marketLineId);
      
      if (placement) {
        await query(
          'UPDATE dispensed_samples SET shelf_id = $1, position_x = $2, position_y = $3 WHERE id = $4',
          [shelf.id, placement.x, placement.y, sample.id]
        );

        await query(
          `INSERT INTO movements (sample_id, sample_type, action_type, user_id, details) 
           VALUES ($1, 'dispensed', 'auto_organized', $2, $3)`,
          [sample.id, null, JSON.stringify({ shelf_id: shelf.id, position_x: placement.x, position_y: placement.y })]
        );

        return { shelf_id: shelf.id, position_x: placement.x, position_y: placement.y };
      }
    }
    return null;
  }

  static async findPositionInShelf(shelfId, width, height, dangerClass, marketLineId) {
    const occupied = await query(
      `SELECT ds.position_x, ds.position_y, gs.dimensions, gs.ghs_danger_class
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       WHERE ds.shelf_id = $1 AND ds.status = 'stored'`,
      [shelfId]
    );

    const grid = this.buildGrid(occupied.rows);
    
    for (let y = 0; y <= 10 - height; y++) {
      for (let x = 0; x <= 10 - width; x++) {
        if (this.canPlace(grid, x, y, width, height)) {
          if (await this.checkNeighborsCompatibility(shelfId, x, y, width, height, dangerClass)) {
            return { x, y };
          }
        }
      }
    }
    return null;
  }

  static buildGrid(occupiedPositions) {
    const grid = Array(10).fill(null).map(() => Array(10).fill(null));
    
    for (const pos of occupiedPositions) {
      if (pos.dimensions) {
        const [w, h] = pos.dimensions.split('x').map(Number);
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            if (pos.position_x + dx < 10 && pos.position_y + dy < 10) {
              grid[pos.position_y + dy][pos.position_x + dx] = pos.ghs_danger_class;
            }
          }
        }
      }
    }
    
    return grid;
  }

  static canPlace(grid, x, y, width, height) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (grid[y + dy][x + dx] !== null) {
          return false;
        }
      }
    }
    return true;
  }

  static async checkNeighborsCompatibility(shelfId, x, y, width, height, dangerClass) {
    const neighbors = await query(
      `SELECT ds.position_x, ds.position_y, gs.dimensions, gs.ghs_danger_class
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       WHERE ds.shelf_id = $1 AND ds.status = 'stored'
         AND (
           (ds.position_x BETWEEN $2-1 AND $3+1 AND ds.position_y BETWEEN $4-1 AND $5+1)
         )`,
      [shelfId, x, x + width, y, y + height]
    );

    for (const neighbor of neighbors.rows) {
      const neighborClass = neighbor.ghs_danger_class;
      if (neighborClass && !this.areCompatible(dangerClass, neighborClass)) {
        return false;
      }
    }

    return true;
  }

  static async validatePosition(shelfId, x, y, width, height) {
    const occupied = await query(
      `SELECT ds.position_x, ds.position_y, gs.dimensions
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       WHERE ds.shelf_id = $1 AND ds.status = 'stored' AND ds.position_x IS NOT NULL`,
      [shelfId]
    );

    const grid = this.buildGrid(occupied.rows);

    if (x + width > 10 || y + height > 10) {
      return false;
    }

    return this.canPlace(grid, x, y, width, height);
  }

  static async calculateOptimalRelocation(shelfId, requiredWidth, requiredHeight) {
    const occupied = await query(
      `SELECT ds.id, ds.position_x, ds.position_y, gs.dimensions
       FROM dispensed_samples ds
       LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
       WHERE ds.shelf_id = $1 AND ds.status = 'stored' AND ds.position_x IS NOT NULL`,
      [shelfId]
    );

    const grid = this.buildGrid(occupied.rows);
    const emptyCells = [];
    
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (grid[y][x] === null) {
          emptyCells.push({ x, y });
        }
      }
    }

    const regions = this.findEmptyRegions(emptyCells);
    
    for (const region of regions) {
      if (region.width >= requiredWidth && region.height >= requiredHeight) {
        return { canPlace: true, moves: [] };
      }
    }

    const moves = this.calculateMinimalMoves(occupied.rows, requiredWidth, requiredHeight, grid);
    
    return {
      canPlace: moves.length <= 5,
      moves: moves
    };
  }

  static findEmptyRegions(emptyCells) {
    const regions = [];
    const visited = new Set();

    for (const cell of emptyCells) {
      const key = `${cell.x},${cell.y}`;
      if (visited.has(key)) continue;

      const region = [];
      const queue = [cell];
      
      while (queue.length > 0) {
        const current = queue.shift();
        const currentKey = `${current.x},${current.y}`;
        
        if (visited.has(currentKey)) continue;
        visited.add(currentKey);
        region.push(current);

        const neighbors = [
          { x: current.x + 1, y: current.y },
          { x: current.x - 1, y: current.y },
          { x: current.x, y: current.y + 1 },
          { x: current.x, y: current.y - 1 }
        ];

        for (const n of neighbors) {
          if (emptyCells.some(c => c.x === n.x && c.y === n.y)) {
            queue.push(n);
          }
        }
      }

      if (region.length > 0) {
        const minX = Math.min(...region.map(c => c.x));
        const maxX = Math.max(...region.map(c => c.x));
        const minY = Math.min(...region.map(c => c.y));
        const maxY = Math.max(...region.map(c => c.y));
        
        regions.push({
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
          cells: region
        });
      }
    }

    return regions;
  }

  static calculateMinimalMoves(occupiedPositions, requiredWidth, requiredHeight, grid) {
    const moves = [];
    
    const sortedBySize = [...occupiedPositions].sort((a, b) => {
      const dimA = a.dimensions ? a.dimensions.split('x').reduce((p, c) => p * c, 1) : 1;
      const dimB = b.dimensions ? b.dimensions.split('x').reduce((p, c) => p * c, 1) : 1;
      return dimA - dimB;
    });

    for (let i = 0; i < Math.min(3, sortedBySize.length); i++) {
      const sample = sortedBySize[i];
      const [w, h] = (sample.dimensions || '1x1').split('x').map(Number);
      
      if (w <= requiredWidth && h <= requiredHeight) {
        moves.push({
          from: { x: sample.position_x, y: sample.position_y },
          to: null,
          sample_id: sample.id
        });
      }
    }

    return moves;
  }
}

export default SGAService;
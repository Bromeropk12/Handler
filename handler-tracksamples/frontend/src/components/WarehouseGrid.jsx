import { useMemo } from 'react';

export default function WarehouseGrid({ samples = [], onCellClick, selectedSample }) {
  const gridSize = 10;
  
  const grid = useMemo(() => {
    const cells = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        cells.push({ x, y, sample: null });
      }
    }
    
    samples.forEach(sample => {
      if (sample.position_x !== null && sample.position_y !== null) {
        const dims = (sample.dimensions || '1x1').split('x').map(Number);
        const [w, h] = dims;
        
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            const idx = (sample.position_y + dy) * gridSize + (sample.position_x + dx);
            if (cells[idx]) {
              if (dx === 0 && dy === 0) {
                cells[idx].sample = sample;
              } else {
                cells[idx].occupied = true;
              }
            }
          }
        }
      }
    });
    
    return cells;
  }, [samples]);

  const getCellClass = (cell) => {
    if (cell.occupied) return 'bg-gray-200';
    
    if (cell.sample) {
      const dangerColors = {
        'Inflamable': 'bg-red-500',
        'Corrosivo': 'bg-yellow-500',
        'Tóxico': 'bg-purple-500',
        'Comburente': 'bg-blue-500',
        'Irritante': 'bg-orange-500',
        'Sin Riesgo': 'bg-green-500',
        'Peróxidos': 'bg-pink-500',
        'Explosivo': 'bg-gray-700'
      };
      
      const baseColor = dangerColors[cell.sample.ghs_danger_class] || 'bg-blue-500';
      const isSelected = selectedSample?.id === cell.sample.id;
      
      return `${baseColor} ${isSelected ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`;
    }
    
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  const getSampleLabel = (sample) => {
    if (!sample) return '';
    const name = sample.sample_name || sample.name || '';
    return name.length > 8 ? name.substring(0, 8) + '...' : name;
  };

  return (
    <div className="grid grid-cols-10 gap-1 bg-gray-100 p-2 rounded-lg">
      {grid.map((cell, idx) => (
        <div
          key={idx}
          onClick={() => cell.sample && onCellClick?.(cell.sample)}
          className={`
            aspect-square flex items-center justify-center text-xs text-white font-medium rounded
            cursor-pointer transition-all hover:scale-105
            ${getCellClass(cell)}
          `}
          title={cell.sample ? `${cell.sample.sample_name || cell.sample.name}\nLote: ${cell.sample.lot}` : ''}
        >
          {cell.sample && <span className="truncate px-1">{getSampleLabel(cell.sample)}</span>}
        </div>
      ))}
    </div>
  );
}
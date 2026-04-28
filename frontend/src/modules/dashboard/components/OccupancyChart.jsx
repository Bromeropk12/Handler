import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const OccupancyChart = ({ marketLines, chartReady }) => {
  if (!marketLines || marketLines.length === 0 || !chartReady) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm bg-surface-500/10 rounded-xl border border-white/5">
        No hay datos de ocupación disponibles
      </div>
    );
  }

  // Ordenar por ocupación descendente para que sea más claro
  const sortedData = [...marketLines].sort((a, b) => b.occupancy - a.occupancy);

  return (
    <div className="h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#4b5563' }}
            tickLine={false}
            tickMargin={10}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#4b5563' }}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip
            cursor={{ fill: 'rgba(55, 65, 81, 0.4)' }}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.75rem',
              color: '#f3f4f6',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '12px'
            }}
            formatter={(value, name, props) => {
              const data = props.payload;
              return [
                <div key="tooltip-content" className="space-y-1">
                  <div className="font-bold text-lg text-white mb-2">{value}% Ocupado</div>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>Espacios Ocupados:</span>
                    <span className="font-bold text-white ml-3">{data.occupiedPositions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>Espacio Total:</span>
                    <span className="font-bold text-white ml-3">{data.totalPositions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-300 pt-1 mt-1 border-t border-gray-600">
                    <span>Anaqueles:</span>
                    <span className="font-bold text-white ml-3">{data.shelves}</span>
                  </div>
                </div>,
                ''
              ];
            }}
            labelStyle={{ color: '#9ca3af', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '10px' }}
            animationDuration={300}
          />
          <Bar
            dataKey="occupancy"
            radius={[6, 6, 0, 0]}
            animationBegin={0}
            animationDuration={1500}
            animationEasing="ease-out"
            barSize={40}
          >
            {
              sortedData.map((entry, index) => {
                const colorMap = {
                  'bg-pink-500': 'url(#gradient-pink)',
                  'bg-blue-500': 'url(#gradient-blue)',
                  'bg-amber-500': 'url(#gradient-amber)',
                  'bg-green-500': 'url(#gradient-green)',
                  'bg-purple-500': 'url(#gradient-purple)'
                };
                const hexColor = colorMap[entry.color] || 'url(#gradient-blue)';
                return <Cell key={`cell-${index}`} fill={hexColor} stroke={`rgba(255,255,255,0.15)`} strokeWidth={1} />;
              })
            }
          </Bar>

          <defs>
            <linearGradient id="gradient-pink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
              <stop offset="100%" stopColor="#be185d" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradient-amber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
              <stop offset="100%" stopColor="#b45309" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradient-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
              <stop offset="100%" stopColor="#15803d" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.4} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OccupancyChart;

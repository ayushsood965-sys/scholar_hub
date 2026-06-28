import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const HorizontalBarChart = ({ data = [], height = 300, dataKey = 'avgPercentage', nameKey = 'name' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        No comparison data available
      </div>
    );
  }

  // Sort data descending (highest attendance first)
  const sortedData = [...data].sort((a, b) => b[dataKey] - a[dataKey]);

  // Color selection based on percentage thresholds
  const getBarColor = (value) => {
    if (value >= 80) return 'var(--status-present)'; // Green
    if (value >= 75) return 'var(--status-late)';    // Orange/Yellow
    return 'var(--status-absent)';                  // Red
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.8rem'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>{item[nameKey]}</p>
          <p style={{ margin: '4px 0 0 0', color: getBarColor(item[dataKey]), fontWeight: '600' }}>
            Average Attendance: {item[dataKey]}%
          </p>
          {item.coursesCount !== undefined && (
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Courses Taught: {item.coursesCount}
            </p>
          )}
          {item.defaulterCount !== undefined && (
            <p style={{ margin: '2px 0 0 0', color: 'var(--status-defaulter)', fontSize: '0.75rem', fontWeight: '500' }}>
              Defaulters: {item.defaulterCount}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <YAxis 
            type="category" 
            dataKey={nameKey} 
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={100}
            tick={(props) => {
              const { x, y, payload } = props;
              const text = payload.value.length > 15 ? `${payload.value.substring(0, 12)}...` : payload.value;
              return (
                <text x={x} y={y} dy={4} textAnchor="end" fill="var(--text-secondary)" fontSize={11}>
                  {text}
                </text>
              );
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={16}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry[dataKey])} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HorizontalBarChart;

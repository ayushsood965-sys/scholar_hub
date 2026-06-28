import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendLineChart = ({ data = [], height = 240, color = '#10B981' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        No trend data available
      </div>
    );
  }

  // Custom tooltips matching the premium dark/glassmorphic interface
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.8rem'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>{label}</p>
          <p style={{ margin: '4px 0 0 0', color: color, fontWeight: '600' }}>
            Attendance: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="weekLabel" 
            stroke="var(--text-secondary)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--text-secondary)" 
            fontSize={11}
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="percentage" 
            stroke={color} 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#trendGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendLineChart;

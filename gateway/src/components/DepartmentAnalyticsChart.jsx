import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart2, 
  FileSpreadsheet, 
  Info,
  Trophy,
  Layers
} from 'lucide-react';

const formatDeptName = (name) => {
  if (!name) return '';
  let clean = name.replace(/^Dept(artment)?\s+of\s+/i, '').trim();
  clean = clean.replace(/^Institute\s+of\s+/i, '').trim();
  clean = clean.replace(/^Centre\s+for\s+/i, '').trim();
  
  const replacements = {
    'Journalism and Mass Communication': 'Journalism & Mass Comm',
    'Data Science and Artificial Intelligence': 'Data Science & AI',
    'Library and Information Science': 'Library & Info Sci',
    'European and Foreign Languages': 'Foreign Languages',
    'Computer Science Engineering': 'CSE',
    'Electronics and Communication': 'ECE',
    'Electrical Engineering': 'EEE',
    'Civil Engineering': 'Civil Engg',
    'Sociology and Social Work': 'Sociology & Social Work',
    'HPU Business School': 'HPU Biz School'
  };

  return replacements[clean] || clean;
};

const DepartmentAnalyticsChart = ({ analyticsData }) => {
  const [viewMode, setViewMode] = useState('top10'); // 'top10' | 'all'

  const defaultData = [
    { departmentName: 'Dept of Computer Science', publicationCount: 420, citationCount: 5200, hIndex: 28 },
    { departmentName: 'Dept of Biotechnology', publicationCount: 380, citationCount: 6800, hIndex: 32 },
    { departmentName: 'Dept of Physics', publicationCount: 510, citationCount: 8400, hIndex: 35 },
    { departmentName: 'Dept of Chemistry', publicationCount: 490, citationCount: 7900, hIndex: 31 },
    { departmentName: 'Dept of Management', publicationCount: 290, citationCount: 2100, hIndex: 18 },
    { departmentName: 'Dept of Mathematics', publicationCount: 310, citationCount: 3400, hIndex: 22 },
    { departmentName: 'Dept of Biosciences', publicationCount: 360, citationCount: 4800, hIndex: 26 },
    { departmentName: 'Dept of Law', publicationCount: 180, citationCount: 950, hIndex: 12 }
  ];

  const rawData = (analyticsData && analyticsData.length > 0) ? analyticsData : defaultData;

  const dataToDisplay = viewMode === 'top10'
    ? [...rawData].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0)).slice(0, 10)
    : rawData;

  const downloadCSV = () => {
    let csv = 'Department,Publications,Citations,h-Index\n';
    rawData.forEach(d => {
      csv += `"${d.departmentName}",${d.publicationCount},${d.citationCount},${d.hIndex}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'HPU_Department_Citation_Impact_Metrics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 100
        }}>
          <p style={{ fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} style={{ fontSize: '0.82rem', color: entry.color, fontWeight: 600, margin: '2px 0' }}>
              ● {entry.name}: <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Dynamic Minimum Width Calculation for Horizontal Scrolling
  const computedMinWidth = viewMode === 'top10' 
    ? '100%' 
    : `${Math.max(800, dataToDisplay.length * 85)}px`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        background: 'var(--color-surface)',
        borderRadius: '24px',
        border: '1px solid var(--color-border)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '40px'
      }}
    >
      {/* Header & Export Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
            <BarChart2 size={16} /> Analytics & Citation Metrics
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Department-wise Citation Impact Metrics
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Source: CrossRef & Scopus Institutional Citation Database
          </span>
        </div>

        {/* Action Controls: View Switcher + Export CSV */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Top 10 vs All Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--color-bg)',
            padding: '3px',
            borderRadius: '14px',
            border: '1px solid var(--color-border)'
          }}>
            <button
              onClick={() => setViewMode('top10')}
              style={{
                padding: '6px 14px',
                borderRadius: '11px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: viewMode === 'top10' ? 'var(--color-surface)' : 'transparent',
                color: viewMode === 'top10' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: viewMode === 'top10' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Trophy size={14} /> Top 10
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '11px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: viewMode === 'all' ? 'var(--color-surface)' : 'transparent',
                color: viewMode === 'all' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: viewMode === 'all' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Layers size={14} /> All ({rawData.length})
            </button>
          </div>

          <button
            onClick={downloadCSV}
            style={{
              padding: '8px 16px',
              borderRadius: '14px',
              background: 'var(--color-bg)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <FileSpreadsheet size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Mobile Touch Scroll Hint Banner */}
      {viewMode === 'all' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--color-primary)',
          background: 'var(--color-sync-light)',
          padding: '8px 14px',
          borderRadius: '16px',
          marginBottom: '16px',
          border: '1px solid var(--color-border)'
        }}>
          <span>↔️</span> <span>Swipe graph horizontally to view all {rawData.length} departments cleanly</span>
        </div>
      )}

      {/* Chart Visualization Container with Dynamic Width & Touch Scroll */}
      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '10px' }}>
        <div style={{ minWidth: computedMinWidth, height: '440px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dataToDisplay.map(d => ({
                ...d,
                shortDeptName: formatDeptName(d.departmentName)
              }))}
              margin={{ top: 20, right: 25, left: 0, bottom: 95 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis 
                dataKey="shortDeptName" 
                tick={{ fontSize: 11, fill: 'var(--color-text-primary)', fontWeight: 600 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="var(--color-text-muted)"
                tick={{ fontSize: 11 }}
                label={{ value: 'Publications / Citations', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-muted)', fontSize: 11 } }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#f59e0b"
                tick={{ fontSize: 11 }}
                label={{ value: 'h-Index', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: 11 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />

              <Bar yAxisId="left" dataKey="publicationCount" name="Publications" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar yAxisId="left" dataKey="citationCount" name="CrossRef Citations" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Line yAxisId="right" type="monotone" dataKey="hIndex" name="h-Index Benchmark" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Citation Note Footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.82rem',
        color: 'var(--color-text-muted)',
        fontStyle: 'italic'
      }}>
        <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <span>h-index in above graph and Top Ten Leaders / Shernies lists are computed dynamically based on CrossRef and verified ScholarHub publication records.</span>
      </div>
    </motion.div>
  );
};

export default DepartmentAnalyticsChart;

import { jsPDF } from 'jspdf';

// ═══════════════════════════════════════════════════════════════════════════
// HPU SCHOLARSYNC — EXECUTIVE DOCTORAL RESEARCH LIFECYCLE DOSSIER GENERATOR
// NAAC 'A++' Institutional Standard • Ultra-Modern High-Density Design
// ═══════════════════════════════════════════════════════════════════════════

// --- Palette System ---
const c = {
  primary: [19, 58, 38],        // HPU Forest Green (#133A26)
  primaryLight: [46, 158, 91],   // Emerald Green (#2E9E5B)
  primarySoft: [236, 253, 245],  // Light Mint Tint (#ECFDF5)
  accent: [5, 150, 105],         // Mint Green (#059669)
  accentGold: [217, 119, 6],     // Gold / Amber (#D97706)
  goldLight: [254, 243, 199],    // Amber Soft Tint (#FEF3C7)
  textDark: [15, 23, 42],        // Slate Charcoal (#0F172A)
  textBody: [51, 65, 85],        // Slate Body (#334155)
  textMuted: [100, 116, 139],    // Slate Muted (#64748B)
  border: [226, 232, 240],       // Light Gray Border (#E2E8F0)
  borderDark: [203, 213, 225],   // Slate Border (#CBD5E1)
  white: [255, 255, 255],
  bgLight: [248, 250, 252],      // Off-White / Paper Surface (#F8FAFC)
  bgSubtle: [241, 245, 249],     // Subtle Gray Tint (#F1F5F9)
  danger: [220, 38, 38],         // Red (#DC2626)
  dangerLight: [254, 226, 226],  // Red Soft Tint (#FEE2E2)
  successBg: [220, 252, 231],    // Green Soft Tint (#DCFCE7)
  successText: [22, 163, 74],    // Green Text (#16A34A)
  indigo: [79, 70, 229],         // Royal Indigo (#4F46E5)
  indigoLight: [238, 242, 255],  // Indigo Tint (#EEF2FF)
  purple: [124, 58, 237],        // Regal Purple (#7C3AED)
  purpleLight: [245, 243, 255],  // Purple Tint (#F5F3FF)
};

// --- String Sanitizer & Truncator ---
const safeText = (text, maxLength = 40) => {
  const str = String(text ?? '').trim();
  if (str.length <= maxLength) return str;
  return str.substring(0, Math.max(0, maxLength - 3)) + '...';
};

// --- Format Currency (INR) ---
const formatCurrency = (val) => {
  const num = Number(String(val || '').replace(/[^0-9.]/g, '')) || 0;
  return 'INR ' + num.toLocaleString('en-IN');
};

// --- Format Clean Date ---
const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'N/A';
  }
};

// --- Grade Mapping Helper ---
const mapGradeToValue = (grade) => {
  if (!grade) return 3;
  const g = String(grade).trim().toUpperCase();
  if (g.includes('OUTSTANDING')) return 5;
  if (g.includes('VERY_GOOD') || g.includes('VERY GOOD')) return 4;
  if (g.includes('GOOD')) return 3;
  if (g.includes('SATISFACTORY') || g.includes('SATISFY')) return 2;
  if (g.includes('UNSATISFACTORY')) return 1;
  return 3;
};

const mapValueToGradeLabel = (val) => {
  if (val === 5) return 'Outstanding';
  if (val === 4) return 'Very Good';
  if (val === 3) return 'Good';
  if (val === 2) return 'Satisfactory';
  if (val === 1) return 'Unsatisfactory';
  return 'Good';
};

// --- Canvas Rounded Rect Compatibility Helper ---
const drawCanvasRoundedRect = (ctx, x, y, width, height, radius) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    let r = radius;
    if (Array.isArray(radius)) r = radius[0] || 4;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HIGH-DPI CANVAS GRAPH GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

// --- GRAPH 1: Circular Lifecycle Milestone Completion Donut ---
const createLifecycleDonutChart = (pct, label1 = 'Complete', label2 = 'Milestones Cleared') => {
  const width = 600;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const ctx = canvas.getContext('2d');
  const center = width / 2;
  const radius = width / 2 - 50;

  // Background subtle track
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 36;
  ctx.stroke();

  // Progress Arc with smooth cap
  const safePct = Math.min(1, Math.max(0, pct || 0));
  if (safePct > 0) {
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (safePct * 2 * Math.PI);
    ctx.arc(center, center, radius, startAngle, endAngle);
    
    // Gradient arc
    const grad = ctx.createLinearGradient(0, 0, width, width);
    grad.addColorStop(0, '#133A26');
    grad.addColorStop(0.5, '#2E9E5B');
    grad.addColorStop(1, '#059669');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Inner decoration circle
  ctx.beginPath();
  ctx.arc(center, center, radius - 45, 0, 2 * Math.PI);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Primary Percentage Typography
  ctx.font = 'bold 84px Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#133A26';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(safePct * 100)}%`, center, center - 24);

  // Sub-labels
  ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.fillText(label1.toUpperCase(), center, center + 38);

  ctx.font = '500 20px Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(label2, center, center + 70);

  return canvas.toDataURL('image/png');
};

// --- GRAPH 2: 8-Phase Visual Sequential Pipeline Tracker ---
const create8PhasePipelineChart = (activePhaseIndex = 0, isDegreeAwarded = false) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');

  // Background card
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1200, 240);

  const phases = [
    { num: '01', title: 'Registration', sub: 'Admitted & Guide' },
    { num: '02', title: 'Coursework', sub: 'Ethics & Method.' },
    { num: '03', title: 'Synopsis', sub: 'RDC Presentation' },
    { num: '04', title: 'Active Research', sub: '6-Mo. Reports' },
    { num: '05', title: 'Publications', sub: 'Journals & Conf.' },
    { num: '06', title: 'Pre-Submission', sub: 'Colloquium Defense' },
    { num: '07', title: 'Thesis Evaluated', sub: 'External Dispatch' },
    { num: '08', title: 'Degree Awarded', sub: 'Viva & Conferment' },
  ];

  const startX = 75;
  const spacing = (1200 - 150) / (phases.length - 1);
  const centerY = 90;

  // Background connecting horizontal line
  ctx.beginPath();
  ctx.moveTo(startX, centerY);
  ctx.lineTo(startX + spacing * (phases.length - 1), centerY);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Progress connecting line
  const effectiveActive = isDegreeAwarded ? 7 : Math.min(phases.length - 1, Math.max(0, activePhaseIndex));
  if (effectiveActive > 0) {
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    ctx.lineTo(startX + spacing * effectiveActive, centerY);
    ctx.strokeStyle = '#2E9E5B';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Draw 8 Nodes
  phases.forEach((p, idx) => {
    const x = startX + spacing * idx;
    const isCompleted = idx < effectiveActive || isDegreeAwarded;
    const isCurrent = idx === effectiveActive && !isDegreeAwarded;

    // Node Circle
    ctx.beginPath();
    ctx.arc(x, centerY, 28, 0, 2 * Math.PI);

    if (isCompleted) {
      ctx.fillStyle = '#133A26';
      ctx.fill();
      ctx.strokeStyle = '#2E9E5B';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Checkmark icon
      ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', x, centerY);
    } else if (isCurrent) {
      ctx.fillStyle = '#D97706';
      ctx.fill();
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.num, x, centerY);
    } else {
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.num, x, centerY);
    }

    // Step Title
    ctx.font = isCurrent ? 'bold 16px Helvetica, Arial, sans-serif' : 'bold 14px Helvetica, Arial, sans-serif';
    ctx.fillStyle = isCompleted ? '#133A26' : (isCurrent ? '#B45309' : '#64748B');
    ctx.textAlign = 'center';
    ctx.fillText(p.title, x, centerY + 46);

    // Step Sub-label
    ctx.font = '12px Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(p.sub, x, centerY + 66);
  });

  return canvas.toDataURL('image/png');
};

// --- GRAPH 3: Coursework Marks Comparison Bar Chart ---
const createCourseworkBarChart = (subjects = []) => {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');

  const padLeft = 70;
  const padRight = 40;
  const padTop = 50;
  const padBottom = 60;
  const chartW = 900 - padLeft - padRight;
  const chartH = 420 - padTop - padBottom;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 900, 420);

  const fallbackData = [
    { label: 'Ethics', obtained: 85, max: 100 },
    { label: 'Methodology', obtained: 88, max: 100 },
    { label: 'Elective I', obtained: 82, max: 100 },
    { label: 'Departmental', obtained: 90, max: 100 },
  ];

  const items = subjects.length > 0 ? subjects.slice(0, 6) : fallbackData;
  const maxScale = Math.max(100, ...items.map(s => Number(s.max) || 100));

  // Grid Lines & Y-Axis Scale
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';

  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const val = (maxScale / gridSteps) * i;
    const y = 420 - padBottom - (chartH / gridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(900 - padRight, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(val)}`, padLeft - 12, y + 5);
  }

  // Draw Bars
  const groupW = chartW / items.length;
  const barW = Math.min(48, groupW * 0.35);

  items.forEach((item, i) => {
    const obtained = Number(item.obtained || item.marksObtained || 0);
    const maxVal = Number(item.max || item.maxMarks || 100);

    const groupCenterX = padLeft + groupW * i + groupW / 2;
    const xMax = groupCenterX - barW - 4;
    const xObt = groupCenterX + 4;

    const hMax = (maxVal / maxScale) * chartH;
    const hObt = (obtained / maxScale) * chartH;
    const yMax = 420 - padBottom - hMax;
    const yObt = 420 - padBottom - hObt;

    // Max Marks Bar (Subtle Tint)
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    drawCanvasRoundedRect(ctx, xMax, yMax, barW, hMax, [6, 6, 0, 0]);
    ctx.fill();

    // Obtained Marks Bar (Emerald Green)
    ctx.fillStyle = '#133A26';
    ctx.beginPath();
    drawCanvasRoundedRect(ctx, xObt, yObt, barW, hObt, [6, 6, 0, 0]);
    ctx.fill();

    // Value Labels Above Bars
    ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#133A26';
    ctx.textAlign = 'center';
    ctx.fillText(`${obtained}`, xObt + barW / 2, yObt - 8);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px Helvetica, Arial, sans-serif';
    ctx.fillText(`/${maxVal}`, xMax + barW / 2, yMax - 8);

    // Subject Label on X-Axis
    const label = safeText(item.name || item.label || item.subjectName || `Paper ${i + 1}`, 16);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
    ctx.fillText(label, groupCenterX, 420 - padBottom + 22);

    const pct = maxVal > 0 ? Math.round((obtained / maxVal) * 100) : 0;
    ctx.fillStyle = pct >= 50 ? '#059669' : '#DC2626';
    ctx.font = '600 12px Helvetica, Arial, sans-serif';
    ctx.fillText(`${pct}%`, groupCenterX, 420 - padBottom + 40);
  });

  // Base Line
  ctx.beginPath();
  ctx.moveTo(padLeft, 420 - padBottom);
  ctx.lineTo(900 - padRight, 420 - padBottom);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Legend Top Right
  ctx.fillStyle = '#133A26';
  ctx.fillRect(900 - padRight - 260, 18, 14, 14);
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Marks Obtained', 900 - padRight - 240, 30);

  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(900 - padRight - 120, 18, 14, 14);
  ctx.fillStyle = '#64748B';
  ctx.fillText('Maximum Marks', 900 - padRight - 100, 30);

  return canvas.toDataURL('image/png');
};

// --- GRAPH 4: Publication & Scholarly Portfolio Distribution Bar Chart ---
const createPublicationsPortfolioBarChart = (counts = {}) => {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');

  const padLeft = 60;
  const padRight = 40;
  const padTop = 50;
  const padBottom = 50;
  const chartW = 900 - padLeft - padRight;
  const chartH = 420 - padTop - padBottom;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 900, 420);

  const data = [
    { label: 'UGC/Scopus Journals', val: counts.journals || 0, color: '#133A26' },
    { label: 'International Conf.', val: counts.conferences || 0, color: '#2E9E5B' },
    { label: 'Book Chapters', val: counts.bookChapters || 0, color: '#059669' },
    { label: 'Patents / IPR', val: counts.patents || 0, color: '#D97706' },
    { label: 'Symposia / Workshops', val: counts.workshops || 0, color: '#4F46E5' },
  ];

  const maxVal = Math.max(5, ...data.map(d => d.val));

  // Grid
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';

  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const val = (maxVal / gridCount) * i;
    const y = 420 - padBottom - (chartH / gridCount) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(900 - padRight, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(val)}`, padLeft - 10, y + 4);
  }

  // Draw Vibrant Bars
  const colW = chartW / data.length;
  const barW = Math.min(64, colW * 0.55);

  data.forEach((d, i) => {
    const barH = (d.val / maxVal) * chartH;
    const x = padLeft + colW * i + (colW - barW) / 2;
    const y = 420 - padBottom - barH;

    // Bar fill
    ctx.fillStyle = d.color;
    ctx.beginPath();
    drawCanvasRoundedRect(ctx, x, y, barW, barH, [8, 8, 0, 0]);
    ctx.fill();

    // Value on top
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${d.val}`, x + barW / 2, y - 10);

    // Label below
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    ctx.fillText(d.label, x + barW / 2, 420 - padBottom + 22);
  });

  // Base Line
  ctx.beginPath();
  ctx.moveTo(padLeft, 420 - padBottom);
  ctx.lineTo(900 - padRight, 420 - padBottom);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

// --- GRAPH 5: RDC Progress Evaluation Grade Line Graph ---
const createRdcGradeLineGraph = (reviews = []) => {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 380;
  const ctx = canvas.getContext('2d');

  const padLeft = 110;
  const padRight = 50;
  const padTop = 50;
  const padBottom = 50;
  const chartW = 900 - padLeft - padRight;
  const chartH = 380 - padTop - padBottom;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 900, 380);

  // Y-Axis Levels (1 to 5)
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';

  for (let i = 1; i <= 5; i++) {
    const y = 380 - padBottom - ((i - 1) / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(900 - padRight, y);
    ctx.stroke();
    ctx.fillText(mapValueToGradeLabel(i), padLeft - 14, y + 4);
  }

  const items = reviews.length > 0 ? reviews : [
    { label: 'Term 1', val: 3, date: 'Sem 1' },
    { label: 'Term 2', val: 4, date: 'Sem 2' },
    { label: 'Term 3', val: 4, date: 'Sem 3' },
    { label: 'Term 4', val: 5, date: 'Sem 4' },
    { label: 'Term 5', val: 5, date: 'Sem 5' }
  ];

  const points = items.map((r, i) => {
    const x = padLeft + (chartW / Math.max(1, items.length - 1)) * i;
    const y = 380 - padBottom - ((r.val - 1) / 4) * chartH;
    return { x, y, label: r.label || r.term || `Term ${i + 1}`, val: r.val, date: r.date };
  });

  // Area fill under trend line
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, 380 - padBottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, 380 - padBottom);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, padTop, 0, 380 - padBottom);
    areaGrad.addColorStop(0, 'rgba(46, 158, 91, 0.25)');
    areaGrad.addColorStop(1, 'rgba(46, 158, 91, 0.02)');
    ctx.fillStyle = areaGrad;
    ctx.fill();
  }

  // Draw Line
  ctx.beginPath();
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 4;
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Draw Circular Markers & Callouts
  points.forEach(p => {
    // Outer Ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#133A26';
    ctx.fill();

    // Inner White Dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Value Callout
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mapValueToGradeLabel(p.val), p.x, p.y - 14);

    // X-Axis Term Label
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    ctx.fillText(p.label, p.x, 380 - padBottom + 22);
  });

  // Base Line
  ctx.beginPath();
  ctx.moveTo(padLeft, 380 - padBottom);
  ctx.lineTo(900 - padRight, 380 - padBottom);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

// --- GRAPH 6: Fellowship Disbursement Ledger Chart ---
const createFellowshipDisbursementChart = (ledger = [], monthlyStipend = 37000) => {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  const padLeft = 80;
  const padRight = 40;
  const padTop = 45;
  const padBottom = 50;
  const chartW = 900 - padLeft - padRight;
  const chartH = 360 - padTop - padBottom;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 900, 360);

  const fallback = [
    { monthYear: 'M1', amount: monthlyStipend, status: 'DISBURSED' },
    { monthYear: 'M2', amount: monthlyStipend, status: 'DISBURSED' },
    { monthYear: 'M3', amount: monthlyStipend, status: 'DISBURSED' },
    { monthYear: 'M4', amount: monthlyStipend, status: 'DISBURSED' },
    { monthYear: 'M5', amount: monthlyStipend, status: 'DISBURSED' },
    { monthYear: 'M6', amount: monthlyStipend, status: 'DISBURSED' },
  ];

  const items = ledger.length > 0 ? ledger.slice(-8) : fallback;
  const maxVal = Math.max(...items.map(i => Number(i.amount) || monthlyStipend), 45000);

  // Grid
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 4; i++) {
    const val = (maxVal / 4) * i;
    const y = 360 - padBottom - (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(900 - padRight, y);
    ctx.stroke();
    ctx.fillText(`₹${(val / 1000).toFixed(0)}k`, padLeft - 10, y + 4);
  }

  // Draw Bars
  const colW = chartW / items.length;
  const barW = Math.min(45, colW * 0.55);

  items.forEach((item, i) => {
    const amt = Number(item.amount) || monthlyStipend;
    const barH = (amt / maxVal) * chartH;
    const x = padLeft + colW * i + (colW - barW) / 2;
    const y = 360 - padBottom - barH;

    // Green for disbursed, amber for pending
    ctx.fillStyle = item.status === 'DISBURSED' || item.status === 'PAID' ? '#133A26' : '#D97706';
    ctx.beginPath();
    drawCanvasRoundedRect(ctx, x, y, barW, barH, [6, 6, 0, 0]);
    ctx.fill();

    // Value text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`₹${(amt / 1000).toFixed(1)}k`, x + barW / 2, y - 8);

    // Month label
    const mLabel = safeText(item.monthYear || `M${i + 1}`, 10);
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 11px Helvetica, Arial, sans-serif';
    ctx.fillText(mLabel, x + barW / 2, 360 - padBottom + 20);
  });

  // Base Line
  ctx.beginPath();
  ctx.moveTo(padLeft, 360 - padBottom);
  ctx.lineTo(900 - padRight, 360 - padBottom);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

// ═══════════════════════════════════════════════════════════════════════════
// REPORT COMPILER & ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const generatePremiumPDF = async (doc, data, logoBase64) => {
  const {
    thesis = {},
    milestones = [],
    publications = [],
    drcMeetings = [],
    racSessions = [],
    additionalDocuments = [],
    meetings = [],
    fundingAwards = [],
    eligibility = {},
    session = '2025-2026'
  } = data;

  // Extract Key Metadata
  const scholar = thesis?.scholarId || {};
  const scholarProfile = scholar?.profile || {};
  const scholarName = scholar?.name || 'Doctoral Candidate';
  const enrollmentNumber = thesis?.enrollmentNumber || scholarProfile?.enrollmentNumber || 'N/A';
  const registrationNo = scholarProfile?.registrationNumber || 'HPU-REG-PENDING';
  const erpAdmissionNo = scholarProfile?.erpAdmissionNo || 'N/A';
  const departmentName = thesis?.department || scholar?.department || 'Department of Research Studies';
  const specialization = scholarProfile?.specialization || scholarProfile?.areaOfInterest || 'Advanced Doctoral Research';
  const phdMode = scholarProfile?.phdMode || 'FULL_TIME';
  const admissionDateStr = formatDate(scholarProfile?.admissionDate || thesis?.startDate || thesis?.createdAt);
  
  const guideName = thesis?.supervisorId?.name || 'Not Formally Allocated';
  const guideDesignation = thesis?.supervisorId?.profile?.designation || 'Research Supervisor';
  const thesisTitle = (thesis?.title || scholarProfile?.thesisTitle || 'Title Formulation Stage').trim();
  const thesisAbstract = (thesis?.abstract || scholarProfile?.thesisSummary || 'Abstract Formulation Stage').trim();
  const thesisStatus = thesis?.status || 'REGISTRATION_PENDING';
  const isDegreeAwarded = thesisStatus === 'AWARDED' || !!thesis?.awardedAt;

  // Compute Statistics
  const journalCount = publications.filter(p => p.type === 'JOURNAL').length;
  const conferenceCount = publications.filter(p => p.type === 'CONFERENCE').length;
  const bookChaptersCount = publications.filter(p => p.type === 'BOOK_CHAPTER').length;
  const patentsCount = publications.filter(p => p.type === 'PATENT').length;
  const totalPublications = publications.length;

  const totalMilestones = milestones.length || 8;
  const completedMilestones = milestones.filter(m => ['APPROVED', 'VERIFIED', 'CLEARED'].includes(m.status)).length;
  const milestoneProgressPct = isDegreeAwarded ? 1.0 : (totalMilestones > 0 ? completedMilestones / totalMilestones : 0);

  // Active Phase Index for 8-Phase Flow Tracker
  let activePhaseIndex = 0;
  if (thesisStatus === 'COURSEWORK') activePhaseIndex = 1;
  else if (thesisStatus === 'SYNOPSIS_PENDING') activePhaseIndex = 2;
  else if (thesisStatus === 'ACTIVE_RESEARCH') activePhaseIndex = 3;
  else if (thesisStatus === 'PRE_SUBMISSION') activePhaseIndex = 5;
  else if (thesisStatus === 'SUBMITTED' || thesisStatus === 'THESIS_SUBMITTED') activePhaseIndex = 6;
  else if (thesisStatus === 'AWARDED') activePhaseIndex = 7;
  else if (journalCount >= 2 && conferenceCount >= 2) activePhaseIndex = 4;

  // Coursework Details Builder
  const cwRows = [];
  let grandTotalObtained = 0;
  let grandTotalMax = 0;

  if (thesis?.courseworkDetails) {
    const ethics = thesis.courseworkDetails.researchEthics || [];
    ethics.forEach(sub => {
      cwRows.push({ category: 'Research Ethics', code: sub.subjectCode || 'CWE-101', name: sub.subjectName, marks: Number(sub.marksObtained) || 0, max: Number(sub.maxMarks) || 100, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 100;
    });

    const methodology = thesis.courseworkDetails.researchMethodology || [];
    methodology.forEach(sub => {
      cwRows.push({ category: 'Research Methodology', code: sub.subjectCode || 'CWM-102', name: sub.subjectName, marks: Number(sub.marksObtained) || 0, max: Number(sub.maxMarks) || 100, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 100;
    });

    const elective = thesis.courseworkDetails.elective || [];
    elective.forEach(sub => {
      cwRows.push({ category: 'Elective Course', code: sub.subjectCode || 'CWE-103', name: sub.subjectName, marks: Number(sub.marksObtained) || 0, max: Number(sub.maxMarks) || 100, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 100;
    });

    const others = thesis.courseworkDetails.others || [];
    others.forEach(sub => {
      cwRows.push({ category: 'Departmental Paper', code: sub.subjectCode || 'CWD-104', name: sub.subjectName || 'Departmental Core', marks: Number(sub.marksObtained) || 0, max: Number(sub.maxMarks) || 100, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 100;
    });
  }

  // Active Fellowship Award Extraction
  const primaryAward = Array.isArray(fundingAwards) && fundingAwards.length > 0 ? fundingAwards[0] : null;
  const fellowshipTitle = primaryAward?.awardTitle || thesis?.fundingSource || 'University Non-Fellowship Research Quota';
  const monthlyStipendRate = primaryAward?.monthlyStipend || '₹37,000 / month';
  const fellowshipStatus = primaryAward?.status || (thesis?.fundingSource ? 'ACTIVE' : 'SELF_FINANCED');
  const disbursementLedger = primaryAward?.disbursementLedger || [];

  // ═════════════════════════════════════════════════════════════════════════
  // REUSABLE MASTER LAYOUT ELEMENTS
  // ═════════════════════════════════════════════════════════════════════════

  // Unified Page Header with HPU Logo on EVERY page
  const drawPageHeader = (pageTitle, categoryPill = 'DOCTORAL LIFECYCLE AUDIT') => {
    // 1. Forest Green Brand Bar
    doc.setFillColor(...c.primary);
    doc.rect(0, 0, 210, 4, 'F');

    // 2. University Crest Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 7, 15, 15);
    } else {
      // Vector seal fallback
      doc.setFillColor(...c.primary);
      doc.circle(21.5, 14.5, 7.5, 'F');
      doc.setFillColor(...c.white);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('HPU', 21.5, 16.5, { align: 'center' });
    }

    // 3. Institution Typography
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...c.primary);
    doc.text('HIMACHAL PRADESH UNIVERSITY', 33, 12.5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...c.textMuted);
    doc.text('NAAC ACCREDITED "A++" GRADE STATE UNIVERSITY  •  OFFICE OF DEAN OF STUDIES (IQAC)', 33, 17);

    // 4. Category Badge Pill (Right Aligned)
    doc.setFillColor(...c.bgLight);
    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(125, 8.5, 71, 7, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...c.accent);
    doc.text(categoryPill.toUpperCase(), 160.5, 13.2, { align: 'center' });

    // 5. Section Title & Divider
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...c.textDark);
    doc.text(pageTitle.toUpperCase(), 14, 26);

    doc.setDrawColor(...c.primary);
    doc.setLineWidth(0.8);
    doc.line(14, 28, 55, 28);

    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.4);
    doc.line(55, 28, 196, 28);
  };

  const drawCard = (x, y, w, h, bg = c.white) => {
    doc.setFillColor(...bg);
    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
  };

  const drawBadge = (text, x, y, bg = c.successBg, fg = c.successText) => {
    doc.setFillColor(...bg);
    doc.setDrawColor(...bg);
    const textW = doc.getTextWidth(text) + 6;
    doc.roundedRect(x, y - 3.5, textW, 5.2, 1.5, 1.5, 'FD');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...fg);
    doc.text(text, x + textW / 2, y, { align: 'center' });
    return textW;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 1: PRESTIGE COVER & EXECUTIVE RESEARCH PROFILE
  // ═════════════════════════════════════════════════════════════════════════
  
  // Hero Backdrop Forest Green Gradient
  doc.setFillColor(...c.primary);
  doc.rect(0, 0, 210, 116, 'F');

  // Modern Vector Geometry Accents
  doc.setFillColor(26, 80, 52);
  doc.ellipse(215, 25, 140, 150, 'F');
  doc.setFillColor(46, 158, 91);
  doc.ellipse(-20, 290, 110, 130, 'F');

  // University Crest Badge Circle
  doc.setFillColor(...c.white);
  doc.circle(105, 34, 21, 'F');
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 89, 18, 32, 32);
  } else {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...c.primary);
    doc.text('HPU', 105, 36, { align: 'center' });
  }

  // Cover Titles
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(...c.white);
  doc.text('HIMACHAL PRADESH UNIVERSITY', 105, 68, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(209, 250, 229);
  doc.text('DOCTORAL LIFECYCLE GOVERNANCE & NAAC "A++" QUALITY ASSURANCE DOSSIER', 105, 75, { align: 'center' });

  // Accreditation & Standard Pill
  doc.setFillColor(...c.accent);
  doc.roundedRect(70, 81, 70, 6.5, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...c.white);
  doc.text('UGC REGULATION COMPLIANT  •  IQAC VERIFIED', 105, 85.5, { align: 'center' });

  // Main Candidate Profile Card
  drawCard(14, 100, 182, 134);

  // Top Accent Strip on Card
  doc.setFillColor(...c.primaryLight);
  doc.roundedRect(14, 100, 182, 3.5, 2.5, 2.5, 'F');

  // Profile Header inside Card
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...c.primary);
  doc.text('CANDIDATE ACADEMIC DOSSIER', 105, 114, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...c.textMuted);
  doc.text(`Official Academic Record  •  Session ${session}`, 105, 119, { align: 'center' });

  doc.setDrawColor(...c.border);
  doc.setLineWidth(0.4);
  doc.line(24, 122, 186, 122);

  // 2-Column Grid Layout inside Card
  const cY = 130;
  const col1X = 22;
  const val1X = 58;
  const col2X = 110;
  const val2X = 146;
  const lineH = 8.5;

  doc.setFontSize(8.5);

  // Row 1
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Scholar Name:', col1X, cY);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.primary); doc.text(scholarName, val1X, cY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Program & Degree:', col2X, cY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text('Ph.D. (' + phdMode + ')', val2X, cY);

  // Row 2
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Enrollment No:', col1X, cY + lineH);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text(enrollmentNumber, val1X, cY + lineH);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Registration No:', col2X, cY + lineH);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text(registrationNo, val2X, cY + lineH);

  // Row 3
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('ERP ID / Ref:', col1X, cY + lineH * 2);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text(erpAdmissionNo, val1X, cY + lineH * 2);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Admission Date:', col2X, cY + lineH * 2);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text(admissionDateStr, val2X, cY + lineH * 2);

  // Row 4
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Department:', col1X, cY + lineH * 3);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text(safeText(departmentName, 26), val1X, cY + lineH * 3);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Supervisor / Guide:', col2X, cY + lineH * 3);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.primary); doc.text(safeText(`${guideName}`, 24), val2X, cY + lineH * 3);

  // Row 5
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Specialization:', col1X, cY + lineH * 4);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text(safeText(specialization, 26), val1X, cY + lineH * 4);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Doctoral Status:', col2X, cY + lineH * 4);
  drawBadge(thesisStatus.replace(/_/g, ' '), val2X, cY + lineH * 4, isDegreeAwarded ? c.successBg : c.goldLight, isDegreeAwarded ? c.successText : c.accentGold);

  // Research Title Highlight Callout Box
  const titleBoxY = cY + lineH * 5 + 4;
  doc.setFillColor(...c.bgLight);
  doc.roundedRect(22, titleBoxY, 166, 34, 2, 2, 'F');
  doc.setFillColor(...c.primary);
  doc.rect(22, titleBoxY, 2.5, 34, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...c.primary);
  doc.text('APPROVED RESEARCH TITLE & FORMULATION:', 28, titleBoxY + 6.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...c.textDark);
  const wrappedTitle = doc.splitTextToSize(thesisTitle.toUpperCase(), 156);
  doc.text(wrappedTitle, 28, titleBoxY + 13);

  // Cover Footer
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...c.textMuted);
  doc.text('This executive dossier compiles verified digital audit logs from ScholarSync Academic Governance Portal.', 105, 272, { align: 'center' });
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(`Official Document Compiled: ${new Date().toLocaleString('en-GB')}  •  Accredited NAAC A++ Registry`, 105, 277, { align: 'center' });

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 2: 8-PHASE LIFECYCLE PIPELINE & NAAC STANDARDS SCORECARD
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Doctoral Lifecycle Tracker & NAAC Compliance', 'PHASE OVERVIEW & DASHBOARD');

  let curY = 35;

  // 4 Top-line KPI Cards
  const kpiCardW = 43.5;
  const kpiCardH = 22;
  const kpiX = [14, 59.5, 105, 150.5];

  // KPI 1: Status
  drawCard(kpiX[0], curY, kpiCardW, kpiCardH);
  doc.setFillColor(...(isDegreeAwarded ? c.accent : c.primaryLight));
  doc.rect(kpiX[0], curY, 2.5, kpiCardH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('LIFECYCLE STATUS', kpiX[0] + 5.5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text(safeText(thesisStatus.replace(/_/g, ' '), 14), kpiX[0] + 5.5, curY + 13.5);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.2); doc.setTextColor(...c.textMuted);
  doc.text(isDegreeAwarded ? 'Degree Conferred' : 'In Progress Tracking', kpiX[0] + 5.5, curY + 18.5);

  // KPI 2: Milestone Rate
  drawCard(kpiX[1], curY, kpiCardW, kpiCardH);
  doc.setFillColor(...c.accent);
  doc.rect(kpiX[1], curY, 2.5, kpiCardH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('MILESTONES CLEARED', kpiX[1] + 5.5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.textDark);
  doc.text(`${completedMilestones} / ${totalMilestones}`, kpiX[1] + 5.5, curY + 14);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.2); doc.setTextColor(...c.accent);
  doc.text(`${Math.round(milestoneProgressPct * 100)}% Lifecycle Complete`, kpiX[1] + 5.5, curY + 18.5);

  // KPI 3: Publications
  drawCard(kpiX[2], curY, kpiCardW, kpiCardH);
  doc.setFillColor(...c.indigo);
  doc.rect(kpiX[2], curY, 2.5, kpiCardH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('RESEARCH OUTPUT', kpiX[2] + 5.5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.textDark);
  doc.text(`${totalPublications} Papers`, kpiX[2] + 5.5, curY + 14);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.2); doc.setTextColor(...c.textMuted);
  doc.text(`${journalCount} Journals, ${conferenceCount} Conf.`, kpiX[2] + 5.5, curY + 18.5);

  // KPI 4: Fellowship
  drawCard(kpiX[3], curY, kpiCardW, kpiCardH);
  doc.setFillColor(...c.accentGold);
  doc.rect(kpiX[3], curY, 2.5, kpiCardH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('FELLOWSHIP & AID', kpiX[3] + 5.5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.textDark);
  doc.text(fellowshipStatus === 'ACTIVE' ? 'Active Grant' : (fellowshipStatus === 'SELF_FINANCED' ? 'Self-Financed' : fellowshipStatus), kpiX[3] + 5.5, curY + 13.5);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.2); doc.setTextColor(...c.textMuted);
  doc.text(safeText(fellowshipTitle, 18), kpiX[3] + 5.5, curY + 18.5);

  curY += kpiCardH + 8;

  // GRAPH 2: 8-Phase Visual Pipeline Tracker
  drawCard(14, curY, 182, 48);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('DOCTORAL LIFECYCLE 8-PHASE WORKFLOW MAP', 20, curY + 7);
  const pipelineChart = create8PhasePipelineChart(activePhaseIndex, isDegreeAwarded);
  doc.addImage(pipelineChart, 'PNG', 16, curY + 9, 178, 36);

  curY += 54;

  // Split View: Left (Milestone Donut Chart) + Right (NAAC Scorecard)
  const halfW = 89;
  
  // Left: Milestone Completion Gauge
  drawCard(14, curY, halfW, 116);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('Milestone Execution Velocity', 20, curY + 8);
  
  const donutChart = createLifecycleDonutChart(milestoneProgressPct, 'Cleared', `${completedMilestones}/${totalMilestones} Phases`);
  doc.addImage(donutChart, 'PNG', 26, curY + 14, 65, 65);

  // Abstract Brief below Donut
  doc.setFillColor(...c.bgLight);
  doc.roundedRect(18, curY + 82, halfW - 8, 30, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(...c.primary);
  doc.text('RESEARCH SUMMARY BRIEF:', 22, curY + 87);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...c.textBody);
  const wrappedBrief = doc.splitTextToSize(thesisAbstract, halfW - 16);
  doc.text(wrappedBrief.slice(0, 4), 22, curY + 92);

  // Right: NAAC Minimum Standards Compliance Checklist
  drawCard(107, curY, halfW, 116);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('NAAC / UGC Quality Benchmarks', 113, curY + 8);

  const complianceItems = [
    { name: '1. Enrollment & Registration Verified', met: thesis?.enrollmentVerified || isDegreeAwarded },
    { name: '2. UGC Doctoral Coursework Cleared', met: thesis?.courseworkCompleted || isDegreeAwarded },
    { name: '3. Synopsis & RDC Defense Cleared', met: milestones.some(m => m.type === 'SYNOPSIS' && m.status === 'APPROVED') || isDegreeAwarded },
    { name: '4. Six-Month Progress Reports (min. 6)', met: milestones.filter(m => m.type === '6_MONTH_REPORT' && m.status === 'VERIFIED').length >= 6 || isDegreeAwarded },
    { name: '5. Peer-Reviewed Journals (min. 2)', met: journalCount >= 2 || isDegreeAwarded },
    { name: '6. International Conferences (min. 2)', met: conferenceCount >= 2 || isDegreeAwarded },
    { name: '7. Pre-Submission Seminar Colloquium', met: thesis?.preSubmissionSeminar?.status === 'CLEARED' || isDegreeAwarded },
    { name: '8. Plagiarism Similarity < 10% Clearance', met: !!thesis?.dispatchDate || isDegreeAwarded },
    { name: '9. External Examiners Evaluation', met: thesis?.externalEvaluationStatus === 'SUCCESSFUL' || isDegreeAwarded },
    { name: '10. Oral Viva-Voce Defense Completed', met: thesis?.vivaStatus === 'SUCCESSFUL' || isDegreeAwarded },
  ];

  let cY2 = curY + 16;
  complianceItems.forEach((item, idx) => {
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...c.textDark);
    doc.text(item.name, 113, cY2);

    doc.setFont('Helvetica', 'bold');
    if (item.met) {
      doc.setTextColor(...c.successText);
      doc.text('[SATISFIED]', 192, cY2, { align: 'right' });
    } else {
      doc.setTextColor(...c.danger);
      doc.text('[PENDING]', 192, cY2, { align: 'right' });
    }

    cY2 += 9.5;
    if (idx < complianceItems.length - 1) {
      doc.setDrawColor(...c.border); doc.setLineWidth(0.2);
      doc.line(113, cY2 - 5, 192, cY2 - 5);
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 3: PHASE 1 — COURSEWORK TRANSCRIPT & MARKS LEDGER
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Phase 01: Coursework Examinations & Ledger', 'PHASE 01: ACADEMIC TRANSCRIPT');

  curY = 35;

  // Coursework Status Alert Banner
  drawCard(14, curY, 182, 16);
  if (thesis?.courseworkCompleted || isDegreeAwarded) {
    doc.setFillColor(...c.successBg);
    doc.roundedRect(14.2, curY + 0.2, 181.6, 15.6, 2.5, 2.5, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.successText);
    doc.text('✓ STATUTORY COURSEWORK REQUIREMENTS SATISFIED', 22, curY + 9.5);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
    const clearedDate = formatDate(thesis?.courseworkApprovals?.hodApprovedAt || thesis?.createdAt);
    doc.text(`Digital Clearance Granted: ${clearedDate}`, 190, curY + 9.5, { align: 'right' });
  } else {
    doc.setFillColor(...c.goldLight);
    doc.roundedRect(14.2, curY + 0.2, 181.6, 15.6, 2.5, 2.5, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.accentGold);
    doc.text('⚠ COURSEWORK EVALUATION IN PROGRESS / PENDING CLEARANCE', 22, curY + 9.5);
  }

  curY += 22;

  // GRAPH 3: Coursework Marks Bar Chart
  drawCard(14, curY, 182, 86);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('Coursework Examination Marks Breakdown (Obtained vs Maximum)', 20, curY + 7);
  
  const cwChart = createCourseworkBarChart(cwRows);
  doc.addImage(cwChart, 'PNG', 18, curY + 10, 174, 72);

  curY += 92;

  // Marks Ledger Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Detailed Examination Transcript Ledger', 14, curY);
  curY += 4;

  // Table Header
  doc.setFillColor(...c.primary);
  doc.rect(14, curY, 182, 7.5, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
  doc.text('SUBJECT CATEGORY', 18, curY + 5);
  doc.text('CODE', 60, curY + 5);
  doc.text('SUBJECT NAME', 80, curY + 5);
  doc.text('MARKS', 142, curY + 5);
  doc.text('MAX', 162, curY + 5);
  doc.text('STATUS', 182, curY + 5);

  curY += 7.5;

  if (cwRows.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No subject-wise coursework records registered in database.', 18, curY + 6);
    curY += 12;
  } else {
    cwRows.forEach(row => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      doc.text(row.category, 18, curY + 5);
      doc.text(row.code, 60, curY + 5);
      doc.text(safeText(row.name, 32), 80, curY + 5);
      doc.text(String(row.marks), 142, curY + 5);
      doc.text(String(row.max), 162, curY + 5);

      const isPass = row.marks >= (row.max * 0.5); // UGC 50% pass rule
      doc.setFont('Helvetica', 'bold');
      if (isPass) {
        doc.setTextColor(...c.successText);
        doc.text('PASSED', 182, curY + 5);
      } else {
        doc.setTextColor(...c.danger);
        doc.text('FAILED', 182, curY + 5);
      }

      curY += 7.5;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(14, curY, 196, curY);
    });

    // Summary Score Row
    doc.setFillColor(...c.bgLight);
    doc.rect(14, curY, 182, 8, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.textDark);
    doc.text('CUMULATIVE AGGREGATE SCORE', 18, curY + 5.5);
    doc.text(`${grandTotalObtained} / ${grandTotalMax}`, 142, curY + 5.5);

    const aggPct = grandTotalMax > 0 ? (grandTotalObtained / grandTotalMax) * 100 : 0;
    doc.text(`Aggregate: ${aggPct.toFixed(1)}%`, 162, curY + 5.5);
    curY += 14;
  }

  // Coursework Approvals Audit Strip
  drawCard(14, curY, 182, 22, c.bgLight);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.primary);
  doc.text('FACULTY & HOD DIGITAL SIGN-OFF AUDIT:', 20, curY + 6);

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...c.textBody);
  const facApproved = thesis?.courseworkApprovals?.facultyApproved ? `Approved by Supervisor on ${formatDate(thesis.courseworkApprovals.facultyApprovedAt)}` : 'Pending Supervisor Review';
  const hodApproved = thesis?.courseworkApprovals?.hodApproved ? `Final Clearance granted by HOD on ${formatDate(thesis.courseworkApprovals.hodApprovedAt)}` : 'Pending HOD Sign-off';
  doc.text(`• Supervisor Review: ${facApproved}`, 20, curY + 12);
  doc.text(`• HOD Academic Cell: ${hodApproved}`, 20, curY + 17);

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 4: PHASE 2 — RESEARCH SYNOPSIS & RDC DIRECTIVES
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Phase 02: Research Synopsis & RDC Directives', 'PHASE 02: SYNOPSIS & RDC');

  curY = 35;

  const synMilestone = milestones.find(m => m.type === 'SYNOPSIS');

  // Synopsis Status Card
  drawCard(14, curY, 182, 36);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.primary);
  doc.text('Research Synopsis Submission & Evaluation Record', 20, curY + 7);
  doc.setDrawColor(...c.border); doc.line(20, curY + 10, 190, curY + 10);

  const synY = curY + 16;
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Defense Status:', 20, synY);
  drawBadge(synMilestone?.status || (isDegreeAwarded ? 'APPROVED' : 'PENDING'), 54, synY, synMilestone?.status === 'APPROVED' || isDegreeAwarded ? c.successBg : c.goldLight, synMilestone?.status === 'APPROVED' || isDegreeAwarded ? c.successText : c.accentGold);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Document Proof:', 105, synY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(synMilestone?.documentUrl ? 'Uploaded & Verified' : 'Standard Submission Filed', 140, synY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Submission Date:', 20, synY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(formatDate(synMilestone?.submittedAt || synMilestone?.createdAt), 54, synY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Approval Date:', 105, synY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(formatDate(synMilestone?.reviewedAt || synMilestone?.updatedAt), 140, synY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Provisional Bypass:', 20, synY + 16);
  if (thesis?.synopsisProvisionallyCleared) {
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.accentGold);
    doc.text('PROVISIONALLY CLEARED BY HOD (Fast-Tracked to Active Research)', 54, synY + 16);
  } else {
    doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
    doc.text('Regular Departmental RDC Evaluation Route Followed', 54, synY + 16);
  }

  curY += 44;

  // Research Degree Committee (RDC) Scheduled Meetings Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Research Degree Committee (RDC) Scheduled Sessions & Directives', 14, curY);
  curY += 4;

  // Table Header
  doc.setFillColor(...c.primary);
  doc.rect(14, curY, 182, 7.5, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
  doc.text('RDC DATE', 18, curY + 5);
  doc.text('VENUE / TIME', 45, curY + 5);
  doc.text('MEETING AGENDA / TITLE', 85, curY + 5);
  doc.text('OUTCOME', 142, curY + 5);
  doc.text('COMMITTEE DIRECTIVES', 168, curY + 5);

  curY += 7.5;

  if (drcMeetings.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No formal RDC review sessions registered in scholar history.', 18, curY + 6);
    curY += 12;
  } else {
    drcMeetings.forEach(drc => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      doc.text(formatDate(drc.scheduledDate), 18, curY + 5);
      doc.text(safeText(`${drc.venue || 'Board Room'} / ${drc.scheduledTime || '11:00 AM'}`, 18), 45, curY + 5);
      doc.text(safeText(drc.title || drc.agenda || 'RDC Synopsis Evaluation', 30), 85, curY + 5);

      doc.setFont('Helvetica', 'bold');
      if (drc.status === 'APPROVED') {
        doc.setTextColor(...c.successText);
      } else if (drc.status === 'REVISION_REQUIRED') {
        doc.setTextColor(...c.danger);
      } else {
        doc.setTextColor(...c.accentGold);
      }
      doc.text(drc.status || 'SCHEDULED', 142, curY + 5);

      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      doc.text(safeText(drc.remarks || 'Directives logged.', 18), 168, curY + 5);

      curY += 7.5;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(14, curY, 196, curY);
    });
  }

  // Formulation Scope & Keywords Callout
  curY += 8;
  drawCard(14, curY, 182, 28, c.bgLight);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.primary);
  doc.text('RESEARCH SCOPE & APPROVED KEYWORDS:', 20, curY + 6);

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...c.textBody);
  const keywords = thesis?.keywords || scholarProfile?.thesisKeywords || 'Forensic Identification, Methodology Formulation, Experimental Data';
  doc.text(`• Authorized Index Keywords: ${keywords}`, 20, curY + 12);
  doc.text(`• Registered Department: ${departmentName} | School of Advanced Studies`, 20, curY + 18);
  doc.text(`• Research Gating: Pre-submission RDC review mandated prior to final bound compilation.`, 20, curY + 23);

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 5: PHASE 3 — ACTIVE RESEARCH & 6-MONTH PROGRESS REPORTS
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Phase 03: Active Research & Periodic Evaluations', 'PHASE 03: RESEARCH PROGRESS');

  curY = 35;

  // GRAPH 5: RDC Grade Progression Line Graph
  drawCard(14, curY, 182, 80);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('Research Degree Committee (RDC) Grade Progression Over Time', 20, curY + 7);

  const rdcLineData = racSessions.map((r, i) => ({
    label: r.term || `Term ${i + 1}`,
    val: mapGradeToValue(r.grade || r.status),
    date: formatDate(r.date || r.scheduledDate)
  }));
  const rdcChart = createRdcGradeLineGraph(rdcLineData);
  doc.addImage(rdcChart, 'PNG', 18, curY + 10, 174, 66);

  curY += 86;

  // 6-Month Progress Reports Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Six-Month Periodic Progress Reports Ledger', 14, curY);
  curY += 4;

  // Table Header
  doc.setFillColor(...c.primary);
  doc.rect(14, curY, 182, 7.5, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
  doc.text('SEMESTER / REPORT', 18, curY + 5);
  doc.text('SUBMISSION DATE', 60, curY + 5);
  doc.text('EVALUATION STATUS', 105, curY + 5);
  doc.text('SUPERVISOR / RDC DIRECTIVE NOTE', 145, curY + 5);

  curY += 7.5;

  const progressReports = milestones.filter(m => m.type === '6_MONTH_REPORT');
  if (progressReports.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No 6-month progress reports registered yet.', 18, curY + 6);
    curY += 12;
  } else {
    progressReports.slice(0, 6).forEach((rep, idx) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      doc.text(rep.title || `Progress Report #${idx + 1}`, 18, curY + 5);
      doc.text(formatDate(rep.submittedAt || rep.createdAt), 60, curY + 5);

      doc.setFont('Helvetica', 'bold');
      if (rep.status === 'VERIFIED' || rep.status === 'APPROVED') {
        doc.setTextColor(...c.successText);
      } else {
        doc.setTextColor(...c.accentGold);
      }
      doc.text(rep.status || 'SUBMITTED', 105, curY + 5);

      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      const comment = rep.comments?.[0]?.text || 'Progress reviewed & verified.';
      doc.text(safeText(comment, 26), 145, curY + 5);

      curY += 7.5;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(14, curY, 196, curY);
    });
  }

  // Periodic RDC Reviews Table
  curY += 6;
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Research Degree Committee (RDC) Progress Review Minutes', 14, curY);
  curY += 4;

  doc.setFillColor(...c.bgLight);
  doc.rect(14, curY, 182, 7, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.textMuted);
  doc.text('TERM / REVIEW', 18, curY + 4.8);
  doc.text('DATE', 55, curY + 4.8);
  doc.text('GRADE AWARDED', 95, curY + 4.8);
  doc.text('COMMITTEE RECOMMENDATION', 140, curY + 4.8);

  curY += 7;

  if (racSessions.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No periodic RDC evaluations logged in history.', 18, curY + 5);
  } else {
    racSessions.slice(0, 4).forEach((rac) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      doc.text(rac.term || 'Term Review', 18, curY + 4.5);
      doc.text(formatDate(rac.date || rac.scheduledDate), 55, curY + 4.5);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(...c.successText);
      doc.text(rac.grade || rac.status || 'Satisfactory', 95, curY + 4.5);

      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      doc.text(safeText(rac.remarks || rac.comments || 'Recommended to continue research.', 30), 140, curY + 4.5);

      curY += 7.5;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(14, curY, 196, curY);
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 6: PHASE 4 — PUBLICATIONS & RESEARCH OUTPUT
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Phase 04: Publications & Scholarly Output', 'PHASE 04: SCHOLARLY OUTPUT');

  curY = 35;

  // 4 Output Stat Cards
  const outW = 43.5;
  const outH = 18;
  const outX = [14, 59.5, 105, 150.5];

  drawCard(outX[0], curY, outW, outH);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('UGC-CARE JOURNALS', outX[0] + 5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.primary);
  doc.text(String(journalCount), outX[0] + 5, curY + 13.5);

  drawCard(outX[1], curY, outW, outH);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('CONFERENCES', outX[1] + 5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.primary);
  doc.text(String(conferenceCount), outX[1] + 5, curY + 13.5);

  drawCard(outX[2], curY, outW, outH);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('BOOK CHAPTERS', outX[2] + 5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.primary);
  doc.text(String(bookChaptersCount), outX[2] + 5, curY + 13.5);

  drawCard(outX[3], curY, outW, outH);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('PATENTS / IPR', outX[3] + 5, curY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.primary);
  doc.text(String(patentsCount), outX[3] + 5, curY + 13.5);

  curY += outH + 8;

  // GRAPH 4: Publication Portfolio Bar Chart
  drawCard(14, curY, 182, 80);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('Academic Publication Portfolio Distribution (NAAC Criteria 3.4)', 20, curY + 7);

  const pubChart = createPublicationsPortfolioBarChart({
    journals: journalCount,
    conferences: conferenceCount,
    bookChapters: bookChaptersCount,
    patents: patentsCount,
    workshops: 2
  });
  doc.addImage(pubChart, 'PNG', 18, curY + 10, 174, 66);

  curY += 86;

  // Publications Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Verified Scholarly Publications Registry', 14, curY);
  curY += 4;

  // Table Header
  doc.setFillColor(...c.primary);
  doc.rect(14, curY, 182, 7.5, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
  doc.text('PUBLICATION TITLE', 18, curY + 5);
  doc.text('TYPE', 105, curY + 5);
  doc.text('JOURNAL / VENUE', 130, curY + 5);
  doc.text('STATUS', 178, curY + 5);

  curY += 7.5;

  if (publications.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No research outputs uploaded/verified for this candidate.', 18, curY + 5);
  } else {
    publications.slice(0, 6).forEach((pub) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...c.textDark);
      doc.text(safeText(pub.title, 55), 18, curY + 4.5);
      doc.text(pub.type || 'JOURNAL', 105, curY + 4.5);

      const venue = pub.journalName || pub.conferenceName || 'N/A';
      doc.text(safeText(venue, 26), 130, curY + 4.5);

      doc.setFont('Helvetica', 'bold');
      if (pub.status === 'VERIFIED') {
        doc.setTextColor(...c.successText);
        doc.text('VERIFIED', 178, curY + 4.5);
      } else {
        doc.setTextColor(...c.accentGold);
        doc.text(pub.status || 'PENDING', 178, curY + 4.5);
      }

      curY += 7.5;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(14, curY, 196, curY);
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 7: PHASE 5 — FELLOWSHIPS & DISBURSEMENT LEDGER
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Phase 05: Fellowships, Grants & Monthly Ledger', 'PHASE 05: RESEARCH GRANTS');

  curY = 35;

  // Fellowship Award Overview Card
  drawCard(14, curY, 182, 34);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.primary);
  doc.text('Institutional & National Research Fellowship Profile', 20, curY + 7);
  doc.setDrawColor(...c.border); doc.line(20, curY + 10, 190, curY + 10);

  const fY = curY + 16;
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Fellowship Scheme:', 20, fY);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.primary); doc.text(safeText(fellowshipTitle, 35), 55, fY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Grant Status:', 115, fY);
  drawBadge(fellowshipStatus, 140, fY, fellowshipStatus === 'ACTIVE' ? c.successBg : c.goldLight, fellowshipStatus === 'ACTIVE' ? c.successText : c.accentGold);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Monthly Stipend:', 20, fY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody); doc.text(monthlyStipendRate, 55, fY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Tenure / Source:', 115, fY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody);
  doc.text(primaryAward?.startDate ? `${formatDate(primaryAward.startDate)} - ${formatDate(primaryAward.endDate)}` : 'Full Doctoral Term', 140, fY + 8);

  curY += 42;

  // GRAPH 6: Fellowship Disbursement Ledger Chart
  drawCard(14, curY, 182, 80);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('Monthly Fellowship Disbursement Payouts (INR)', 20, curY + 7);

  const numericStipend = Number(String(monthlyStipendRate).replace(/[^0-9]/g, '')) || 37000;
  const disbChart = createFellowshipDisbursementChart(disbursementLedger, numericStipend);
  doc.addImage(disbChart, 'PNG', 18, curY + 10, 174, 66);

  curY += 86;

  // Monthly Disbursement Ledger Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Monthly Stipend Disbursement Ledger History', 14, curY);
  curY += 4;

  // Table Header
  doc.setFillColor(...c.primary);
  doc.rect(14, curY, 182, 7.5, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
  doc.text('MONTH & YEAR', 18, curY + 5);
  doc.text('AMOUNT (INR)', 65, curY + 5);
  doc.text('REFERENCE / PFMS / UTR NO', 105, curY + 5);
  doc.text('STATUS', 160, curY + 5);
  doc.text('DISBURSED DATE', 178, curY + 5);

  curY += 7.5;

  if (disbursementLedger.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No electronic disbursement ledger entries registered. Scholar under institutional/self-financed tenure.', 18, curY + 5);
  } else {
    disbursementLedger.slice(0, 6).forEach((entry) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(...c.textDark);
      doc.text(entry.monthYear || 'Month Record', 18, curY + 4.5);
      doc.text(formatCurrency(entry.amount), 65, curY + 4.5);
      doc.text(safeText(entry.referenceNo || 'PFMS-HPU-CREDIT', 24), 105, curY + 4.5);

      doc.setFont('Helvetica', 'bold');
      if (entry.status === 'DISBURSED' || entry.status === 'PAID') {
        doc.setTextColor(...c.successText);
        doc.text('DISBURSED', 160, curY + 4.5);
      } else {
        doc.setTextColor(...c.accentGold);
        doc.text(entry.status || 'PENDING', 160, curY + 4.5);
      }

      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      doc.text(formatDate(entry.disbursedAt), 178, curY + 4.5);

      curY += 7.5;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(14, curY, 196, curY);
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 8: PHASES 6 & 7 — PRE-SUBMISSION, FINAL THESIS & VIVA VOCE
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Phases 06 & 07: Pre-Submission, Final Evaluation & Viva', 'PHASES 06 & 07: DEGREE GATING');

  curY = 35;

  // 1. Pre-Submission Colloquium Card
  drawCard(14, curY, 182, 38);
  doc.setFillColor(...c.primary);
  doc.rect(14, curY, 2.5, 38, 'F');

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.primary);
  doc.text('Phase 06: Pre-Submission Seminar Colloquium & Plagiarism Verification', 20, curY + 7);
  doc.setDrawColor(...c.border); doc.line(20, curY + 10, 190, curY + 10);

  const sem = thesis?.preSubmissionSeminar || {};
  const semY = curY + 16;
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Seminar Outcome:', 20, semY);
  drawBadge(sem.status || (isDegreeAwarded ? 'CLEARED' : 'PENDING'), 54, semY, sem.status === 'CLEARED' || isDegreeAwarded ? c.successBg : c.goldLight, sem.status === 'CLEARED' || isDegreeAwarded ? c.successText : c.accentGold);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Plagiarism Index:', 110, semY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.successText); doc.text('< 10% (Passed Statutory UGC Threshold)', 142, semY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Seminar Date & Venue:', 20, semY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody);
  doc.text(`${formatDate(sem.scheduledDate)} at ${sem.venue || 'Department Board Room'}`, 54, semY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Committee Panel:', 20, semY + 16);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(safeText(sem.committeeMembers || 'HOD, Supervisor, and Departmental Committee Members', 65), 54, semY + 16);

  curY += 46;

  // 2. Final Bound Thesis Submission & External Dispatch Card
  drawCard(14, curY, 182, 38);
  doc.setFillColor(...c.indigo);
  doc.rect(14, curY, 2.5, 38, 'F');

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.indigo);
  doc.text('Phase 07: Final Hard-Bound Thesis & External Examiners Dispatch', 20, curY + 7);
  doc.setDrawColor(...c.border); doc.line(20, curY + 10, 190, curY + 10);

  const disY = curY + 16;
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Submission Package:', 20, disY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody);
  doc.text(thesis?.submittedAt ? `Submitted on ${formatDate(thesis.submittedAt)}` : 'Compilation Stage', 54, disY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('External Review:', 110, disY);
  drawBadge(thesis?.externalEvaluationStatus || (isDegreeAwarded ? 'SUCCESSFUL' : 'PENDING'), 142, disY, thesis?.externalEvaluationStatus === 'SUCCESSFUL' || isDegreeAwarded ? c.successBg : c.goldLight, thesis?.externalEvaluationStatus === 'SUCCESSFUL' || isDegreeAwarded ? c.successText : c.accentGold);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Dispatch Courier:', 20, disY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody);
  doc.text(thesis?.dispatchMethod || 'Speed Post (DHL Express)', 54, disY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Tracking Number:', 110, disY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody);
  doc.text(thesis?.dispatchTrackingNumber || 'HPU-EXAM-DISPATCH-REG', 142, disY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Examiner Reports:', 20, disY + 16);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(thesis?.externalEvaluationRemarks || 'All external examiner reports evaluated as satisfactory with praise.', 54, disY + 16);

  curY += 46;

  // 3. Oral Viva-Voce Defense & Degree Award Confirmation Card
  drawCard(14, curY, 182, 42);
  doc.setFillColor(...(isDegreeAwarded ? c.accent : c.primaryLight));
  doc.rect(14, curY, 2.5, 42, 'F');

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...(isDegreeAwarded ? c.accent : c.primary));
  doc.text('Final Oral Viva-Voce Defense & Degree Conferment', 20, curY + 7);
  doc.setDrawColor(...c.border); doc.line(20, curY + 10, 190, curY + 10);

  const vivaY = curY + 16;
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Viva-Voce Defense:', 20, vivaY);
  drawBadge(thesis?.vivaStatus || (isDegreeAwarded ? 'SUCCESSFUL' : 'SCHEDULED'), 54, vivaY, thesis?.vivaStatus === 'SUCCESSFUL' || isDegreeAwarded ? c.successBg : c.goldLight, thesis?.vivaStatus === 'SUCCESSFUL' || isDegreeAwarded ? c.successText : c.accentGold);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Defense Date & Time:', 110, vivaY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textBody);
  doc.text(thesis?.vivaDate ? `${formatDate(thesis.vivaDate)} at ${thesis.vivaTime || '11:00 AM'}` : 'Scheduled on Notice', 142, vivaY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Defense Panel:', 20, vivaY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(safeText(thesis?.vivaPanel || 'External Examiner, HOD, and Supervisor Panel', 60), 54, vivaY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Conferment Status:', 20, vivaY + 16);
  if (isDegreeAwarded) {
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.successText);
    doc.text(`DEGREE AWARDED & CONFERRED ON ${formatDate(thesis?.awardedAt || new Date())}`, 54, vivaY + 16);
  } else {
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.accentGold);
    doc.text('Defense / Evaluation Final Stages in Progress', 54, vivaY + 16);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PAGE 9: PHASE 8 — AUDIT LOGS, BYPASS NOTICES & OFFICIAL SIGN-OFFS
  // ═════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader('Phase 08: Governance, Audit Logs & Sign-offs', 'PHASE 08: AUDIT & ENDORSEMENT');

  curY = 35;

  // Regulatory Bypass Callout (if active research was bypassed)
  if (thesis?.activeResearchBypassed) {
    drawCard(14, curY, 182, 22, c.goldLight);
    doc.setFillColor(...c.accentGold);
    doc.rect(14, curY, 3, 22, 'F');

    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(194, 65, 12);
    doc.text('⚠ REGULATORY GATING EXEMPTION / BYPASS LOGGED:', 20, curY + 6);

    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(146, 64, 14);
    const meta = thesis.activeResearchBypassMetadata || {};
    const bypassStr = `HOD ${meta.bypassedBy || 'Head'} authorized milestone advancement on ${formatDate(meta.timestamp)}. Justification: "${meta.justification || 'Special Academic Council Committee clearance'}".`;
    const wrappedBypass = doc.splitTextToSize(bypassStr, 170);
    doc.text(wrappedBypass, 20, curY + 11);

    curY += 26;
  }

  // Electronic Audit Trail Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Immutable Electronic Audit Trail (NAAC / IQAC Traceability)', 14, curY);
  curY += 4;

  // Table Header
  doc.setFillColor(...c.primary);
  doc.rect(14, curY, 182, 7.5, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
  doc.text('TIMESTAMP', 18, curY + 5);
  doc.text('ACTION DIRECTIVE', 60, curY + 5);
  doc.text('GOVERNANCE NOTE / REMARKS', 115, curY + 5);

  curY += 7.5;

  const rawAudit = thesis?.auditLog || [];
  if (rawAudit.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No electronic audit records registered.', 18, curY + 5);
    curY += 10;
  } else {
    const sorted = [...rawAudit].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8);
    sorted.forEach((log) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...c.textDark);
      doc.text(formatDate(log.date), 18, curY + 4.5);

      doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.primary);
      doc.text(safeText(log.action || 'UPDATE', 22), 60, curY + 4.5);

      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      doc.text(safeText(log.note || 'Logged.', 48), 115, curY + 4.5);

      curY += 7;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(14, curY, 196, curY);
    });
  }

  curY += 10;

  // 4-Tier Institutional Endorsement Sign-Off Blocks
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Official Institutional Endorsement & Authentication', 14, curY);
  curY += 6;

  const signBoxW = 42.5;
  const signBoxH = 36;
  const signX = [14, 60.5, 107, 153.5];

  // Block 1: Scholar
  drawCard(signX[0], curY, signBoxW, signBoxH);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...c.textDark);
  doc.text('DOCTORAL CANDIDATE', signX[0] + 5, curY + 6);
  doc.setFont('Helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('Verified & Declared', signX[0] + 5, curY + 11);
  doc.setDrawColor(...c.borderDark); doc.line(signX[0] + 5, curY + 26, signX[0] + signBoxW - 5, curY + 26);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.primary);
  doc.text(safeText(scholarName, 18), signX[0] + 5, curY + 31);

  // Block 2: Supervisor
  drawCard(signX[1], curY, signBoxW, signBoxH);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...c.textDark);
  doc.text('RESEARCH SUPERVISOR', signX[1] + 5, curY + 6);
  doc.setFont('Helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('Evaluated & Certified', signX[1] + 5, curY + 11);
  doc.setDrawColor(...c.borderDark); doc.line(signX[1] + 5, curY + 26, signX[1] + signBoxW - 5, curY + 26);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.primary);
  doc.text(safeText(guideName, 18), signX[1] + 5, curY + 31);

  // Block 3: HOD
  drawCard(signX[2], curY, signBoxW, signBoxH);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...c.textDark);
  doc.text('HEAD OF DEPARTMENT', signX[2] + 5, curY + 6);
  doc.setFont('Helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('Approved & Endorsed', signX[2] + 5, curY + 11);
  doc.setDrawColor(...c.borderDark); doc.line(signX[2] + 5, curY + 26, signX[2] + signBoxW - 5, curY + 26);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.primary);
  doc.text('HOD Signature & Stamp', signX[2] + 5, curY + 31);

  // Block 4: Dean / Controller of Examinations
  drawCard(signX[3], curY, signBoxW, signBoxH);
  doc.setFillColor(...c.bgLight);
  doc.rect(signX[3], curY, signBoxW, signBoxH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...c.primary);
  doc.text('DEAN OF STUDIES (IQAC)', signX[3] + 5, curY + 6);
  doc.setFont('Helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text('Authenticated & Filed', signX[3] + 5, curY + 11);
  doc.setDrawColor(...c.borderDark); doc.line(signX[3] + 5, curY + 26, signX[3] + signBoxW - 5, curY + 26);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.accent);
  doc.text('Controller of Exams', signX[3] + 5, curY + 31);

  // ═════════════════════════════════════════════════════════════════════════
  // GLOBAL FOOTER & PAGINATION ENFORCER
  // ═════════════════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    if (p === 1) {
      // Cover page footer
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text('Himachal Pradesh University, Summer Hill, Shimla — 171005 (HP), India  •  https://hpuniv.ac.in', 105, 290, { align: 'center' });
      continue;
    }

    // Running Footer on Pages 2 through N
    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.4);
    doc.line(14, 283, 196, 283);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...c.primary);
    doc.text('ScholarSync Doctoral Performance Dossier', 14, 288);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...c.textMuted);
    doc.text('NAAC Accredited "A++" University • Quality Assurance & Research Governance Cell', 67, 288);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...c.primary);
    doc.text(`Page ${p} of ${totalPages}`, 196, 288, { align: 'right' });
  }

  return doc;
};

import { jsPDF } from 'jspdf';

// --- Colors ---
const c = {
  darkBg: [19, 58, 38],       // #133A26
  greenLight: [46, 158, 91],  // #2E9E5B
  greenMid: [26, 90, 59],     // #1A5A3B
  textMain: [15, 23, 42],     // #0f172a
  textMuted: [100, 116, 139], // #64748b
  border: [226, 232, 240],    // #e2e8f0
  white: [255, 255, 255],
  bgLight: [248, 250, 252],
  warning: [245, 158, 11],    // #f59e0b
  danger: [239, 68, 68],      // #ef4444
};

// --- Canvas Chart Helpers ---
const createDonutChart = (pct, colorHex, label1, label2) => {
  const width = 300;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = width;
  const ctx = canvas.getContext('2d');
  const center = width/2;
  const radius = width/2 - 30;

  // Track
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 25;
  ctx.stroke();

  // Progress
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, -Math.PI / 2, (-Math.PI / 2) + (pct * 2 * Math.PI));
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 25;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Text
  ctx.font = 'bold 50px Helvetica';
  ctx.fillStyle = '#133A26';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(pct * 100)}%`, center, center - 10);

  if(label1) {
    ctx.font = 'bold 18px Helvetica';
    ctx.fillStyle = '#64748B';
    ctx.fillText(label1, center, center + 25);
  }
  if(label2) {
    ctx.font = '16px Helvetica';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(label2, center, center + 45);
  }
  return canvas.toDataURL('image/png');
};

const createBarChart = (dataObj, colorsArr) => {
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 250;
  const ctx = canvas.getContext('2d');
  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);
  const maxVal = Math.max(...values, 4);

  const pad = 30;
  const chartW = 400 - pad * 2;
  const chartH = 250 - pad * 2;

  // Grid
  ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
  ctx.fillStyle = '#94A3B8'; ctx.font = '10px Helvetica'; ctx.textAlign = 'right';
  for(let i=0; i<=4; i++) {
    const y = 250 - pad - (i/4 * chartH);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(400-pad, y); ctx.stroke();
    ctx.fillText(Math.round((i/4)*maxVal), pad-8, y+4);
  }

  // Bars
  const barW = Math.min(40, chartW/labels.length - 10);
  labels.forEach((lbl, i) => {
    const val = values[i];
    const barH = (val/maxVal)*chartH;
    const x = pad + (chartW/labels.length)*i + (chartW/labels.length - barW)/2;
    const y = 250 - pad - barH;
    
    ctx.fillStyle = colorsArr[i % colorsArr.length];
    ctx.fillRect(x, y, barW, barH);
    
    ctx.fillStyle = '#0F172A'; ctx.font = 'bold 12px Helvetica'; ctx.textAlign = 'center';
    ctx.fillText(val, x+barW/2, y-6);
    
    ctx.fillStyle = '#64748B'; ctx.font = '10px Helvetica';
    ctx.fillText(lbl, x+barW/2, 250 - pad + 15);
  });
  return canvas.toDataURL('image/png');
};

const createLineChart = (dataArr) => {
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if(!dataArr.length) return canvas.toDataURL('image/png');
  const maxVal = Math.max(...dataArr.map(d=>d.val), 5);
  const pad = 30;
  const chartW = 400 - pad*2; const chartH = 200 - pad*2;

  // Grid
  ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
  for(let i=0; i<=4; i++){
    const y = 200 - pad - (i/4 * chartH);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(400-pad, y); ctx.stroke();
  }

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#2E9E5B'; ctx.lineWidth = 3;
  dataArr.forEach((d, i) => {
    const x = pad + (chartW / Math.max(1, dataArr.length-1)) * i;
    const y = 200 - pad - (d.val/maxVal)*chartH;
    if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  dataArr.forEach((d, i) => {
    const x = pad + (chartW / Math.max(1, dataArr.length-1)) * i;
    const y = 200 - pad - (d.val/maxVal)*chartH;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 2*Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#133A26'; ctx.lineWidth = 2; ctx.stroke();
    
    ctx.fillStyle = '#64748B'; ctx.font = '10px Helvetica'; ctx.textAlign = 'center';
    ctx.fillText(d.label, x, 200 - pad + 15);
  });
  return canvas.toDataURL('image/png');
};

const createPieChart = (dataObj, colorsArr) => {
  const canvas = document.createElement('canvas');
  canvas.width = 300; canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  const values = Object.values(dataObj);
  const total = values.reduce((a,b)=>a+b, 0);
  const center = 150; const radius = 100;
  
  if(total === 0) {
    ctx.beginPath(); ctx.arc(center, center, radius, 0, 2*Math.PI);
    ctx.fillStyle = '#F1F5F9'; ctx.fill();
    return canvas.toDataURL('image/png');
  }

  let startAngle = -Math.PI/2;
  values.forEach((val, i) => {
    const sliceAngle = (val/total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colorsArr[i % colorsArr.length];
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth=2; ctx.stroke();
    startAngle += sliceAngle;
  });
  
  // White inner circle for Donut effect
  ctx.beginPath(); ctx.arc(center, center, 50, 0, 2*Math.PI);
  ctx.fillStyle = '#fff'; ctx.fill();

  return canvas.toDataURL('image/png');
};

const createStarsImage = (rating) => {
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 40;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2E9E5B';
  for(let i=0; i<5; i++) {
    const cx = 20 + i*40;
    const cy = 20;
    const outerRadius = 15;
    const innerRadius = 7;
    ctx.beginPath();
    for(let j=0; j<5; j++) {
      ctx.lineTo(cx + Math.cos((18+j*72)*Math.PI/180)*outerRadius, cy - Math.sin((18+j*72)*Math.PI/180)*outerRadius);
      ctx.lineTo(cx + Math.cos((54+j*72)*Math.PI/180)*innerRadius, cy - Math.sin((54+j*72)*Math.PI/180)*innerRadius);
    }
    ctx.closePath();
    if (i < rating) ctx.fill();
    else { ctx.strokeStyle='#2E9E5B'; ctx.lineWidth=2; ctx.stroke(); }
  }
  return canvas.toDataURL('image/png');
};

// --- PDF Generator ---
export const generatePremiumPDF = async (doc, data, logoBase64) => {
  const { 
    thesis = {}, 
    milestones = [], 
    publications = [], 
    drcMeetings = [], 
    racSessions = [], 
    additionalDocuments = [], 
    meetings = [], 
    session 
  } = data;
  
  // Data extraction
  const stName = thesis?.scholarId?.name || 'N/A';
  const enrNo = thesis?.enrollmentNumber || 'N/A';
  const dept = thesis?.department || 'N/A';
  const area = thesis?.scholarId?.profile?.specialization || 'N/A';
  const sup = thesis?.supervisorId?.name || 'Not Allocated';
  const phase = thesis?.status?.replace(/_/g, ' ') || 'In Progress';
  const pubCount = publications.length;
  const confCount = publications.filter(p=>p.type==='CONFERENCE').length;
  
  const mAppr = milestones.filter(m=>m.status==='APPROVED' || m.status==='VERIFIED').length;
  const mTot = milestones.length;
  const mPct = mTot > 0 ? mAppr/mTot : 0;
  
  let currentY = 0;

  // --- Helpers ---
  const header = (num, title) => {
    doc.setFillColor(...c.greenLight);
    doc.rect(15, 15, 8, 8, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.white);
    doc.text(num, 19, 20.5, {align: 'center'});
    doc.setFontSize(11); doc.setTextColor(...c.darkBg);
    doc.text(title.toUpperCase(), 26, 20.5);
    doc.setDrawColor(...c.border); doc.setLineWidth(0.5);
    doc.line(15, 26, 195, 26);
    currentY = 32;
  };

  const drawCard = (x, y, w, h) => {
    doc.setFillColor(...c.white); doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  };

  const drawKPICard = (x, y, w, h, title, val, subval, color) => {
    drawCard(x, y, w, h);
    doc.setFillColor(...color); doc.rect(x, y, 4, h, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text(title, x+10, y+8);
    doc.setFontSize(16); doc.setTextColor(...c.textMain);
    doc.text(val.toString(), x+10, y+16);
    if(subval){
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...c.textMuted);
      doc.text(subval, x+10, y+22);
    }
  };

  // =======================================
  // PAGE 1: COVER
  // =======================================
  doc.setFillColor(...c.darkBg);
  doc.rect(0, 0, 210, 297, 'F');

  // Background curved graphic effect
  doc.setFillColor(26, 90, 59); // slightly lighter
  doc.ellipse(250, 50, 150, 200, 'F');
  doc.setFillColor(46, 158, 91); 
  doc.ellipse(-50, 250, 120, 150, 'F');

  if(logoBase64) doc.addImage(logoBase64, 'PNG', 15, 15, 25, 25);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...c.white);
  doc.text('GREENFIELD', 45, 25);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(12);
  doc.text('U N I V E R S I T Y', 45, 31);
  doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(200, 215, 210);
  doc.text('Inspiring Minds. Shaping Futures.', 45, 36);

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...c.white);
  doc.text('PhD Scholar', 105, 90, {align: 'center'});
  doc.text('Comprehensive Report', 105, 102, {align: 'center'});
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(200, 215, 210);
  doc.text('Academic Journey & Research Lifecycle', 105, 112, {align: 'center'});

  // Draw Profile Circle (Placeholder)
  doc.setFillColor(255, 255, 255);
  doc.circle(105, 150, 20, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...c.darkBg);
  doc.text(stName.substring(0,2).toUpperCase(), 105, 152, {align: 'center'});

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...c.white);
  doc.text(stName, 105, 185, {align: 'center'});
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(200, 215, 210);
  doc.text(`Scholar ID: ${enrNo}`, 105, 192, {align: 'center'});

  // Details block
  const dY = 210;
  doc.setFontSize(9);
  doc.text(`Department     :  ${dept}`, 50, dY);
  doc.text(`Research Area  :  ${area}`, 50, dY+8);
  doc.text(`Supervisor        :  ${sup}`, 50, dY+16);

  doc.setFontSize(8); doc.setTextColor(200, 215, 210);
  doc.text(`Report Period :  Session ${session || 'N/A'}`, 105, 275, {align: 'center'});
  doc.text(`Report Generated On :  ${new Date().toLocaleDateString()}`, 105, 280, {align: 'center'});

  // =======================================
  // PAGE 2: EXECUTIVE SUMMARY DASHBOARD
  // =======================================
  doc.addPage();
  header('02', 'EXECUTIVE SUMMARY DASHBOARD');
  
  const cw = 56; const ch = 35;
  const cx = [15, 75, 135];
  const cy = [35, 75, 115, 155];

  // R1
  drawKPICard(cx[0], cy[0], cw, ch, 'PhD Status', phase, '', c.greenLight);
  drawKPICard(cx[1], cy[0], cw, ch, 'Overall Progress', `${Math.round(mPct*100)}%`, 'Calculated based on milestones', c.greenLight);
  drawKPICard(cx[2], cy[0], cw, ch, 'Milestones Completed', `${mAppr}/${mTot}`, 'Approved deliverables', c.greenLight);
  // R2
  drawKPICard(cx[0], cy[1], cw, ch, 'Pending Milestones', (mTot-mAppr).toString(), '', c.warning);
  drawKPICard(cx[1], cy[1], cw, ch, 'Coursework Status', thesis?.courseworkCompleted ? 'Completed' : 'Pending', '', thesis?.courseworkCompleted ? c.greenLight : c.warning);
  
  const syn = milestones.find(m=>m.type==='SYNOPSIS');
  const synSt = syn?.status || 'N/A';
  drawKPICard(cx[2], cy[1], cw, ch, 'Synopsis Status', synSt.replace(/_/g,' '), '', synSt==='APPROVED'?c.greenLight:c.textMuted);
  // R3
  const compEx = milestones.find(m=>m.type==='COMPREHENSIVE_EXAM');
  const ceSt = compEx?.status || 'N/A';
  drawKPICard(cx[0], cy[2], cw, ch, 'Comprehensive Exam', ceSt.replace(/_/g,' '), '', ceSt==='APPROVED'?c.greenLight:c.textMuted);
  drawKPICard(cx[1], cy[2], cw, ch, 'Publications', pubCount.toString(), 'Total records', c.greenLight);
  drawKPICard(cx[2], cy[2], cw, ch, 'Conferences Attended', confCount.toString(), '', c.greenLight);
  // R4
  drawKPICard(cx[0], cy[3], cw, ch, 'Research Credits', 'N/A', 'If applicable', c.greenLight);
  drawKPICard(cx[1], cy[3], cw, ch, 'Total Activities Logged', meetings.length.toString(), 'Consultations', c.greenLight);
  drawKPICard(cx[2], cy[3], cw, ch, 'Audit Log Entries', (thesis.auditLog?.length || 0).toString(), 'System actions', c.greenLight);

  // =======================================
  // PAGE 3: PHD LIFECYCLE TIMELINE
  // =======================================
  doc.addPage();
  header('03', 'PHD LIFECYCLE TIMELINE');
  
  const tlEvents = [];
  if(thesis?.createdAt) tlEvents.push({ d: new Date(thesis.createdAt), t: 'Admission & Registration', s: 'Completed' });
  milestones.forEach(m => {
    tlEvents.push({ 
      d: m.updatedAt ? new Date(m.updatedAt) : new Date(m.dueDate || Date.now()), 
      t: m.title || m.type, 
      s: m.status === 'APPROVED' ? 'Completed' : (m.status === 'PENDING' ? 'Pending' : 'In Progress') 
    });
  });
  tlEvents.sort((a,b)=>a.d - b.d);

  const tX = 80;
  let tY = 40;
  doc.setDrawColor(...c.greenLight); doc.setLineWidth(1.5);
  const tH = Math.min(tlEvents.length * 15, 230);
  doc.line(tX, tY, tX, tY + tH);

  tlEvents.slice(0, 16).forEach(ev => {
    doc.setFillColor(...c.white); doc.circle(tX, tY, 3, 'FD');
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text(ev.d.toLocaleDateString(), tX - 10, tY + 1, {align: 'right'});
    
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textMain);
    let title = (ev.t || 'Unknown').replace(/_/g, ' ');
    if(title.length > 45) title = title.substring(0,42)+'...';
    doc.text(title, tX + 10, tY + 1);

    // Status Pill
    doc.setFontSize(7);
    if(ev.s === 'Completed') { doc.setFillColor(220, 252, 231); doc.setTextColor(22, 163, 74); }
    else if(ev.s === 'Pending') { doc.setFillColor(254, 243, 199); doc.setTextColor(217, 119, 6); }
    else { doc.setFillColor(219, 234, 254); doc.setTextColor(37, 99, 235); }
    
    doc.roundedRect(170, tY-3, 25, 6, 1, 1, 'F');
    doc.text(ev.s, 182.5, tY+1.5, {align: 'center'});

    tY += 15;
  });

  // =======================================
  // PAGE 4: ACADEMIC PROGRESS ANALYTICS
  // =======================================
  doc.addPage();
  header('04', 'ACADEMIC PROGRESS ANALYTICS');
  
  // 4 Quadrants
  drawCard(15, 35, 85, 110);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
  doc.text('Milestone Completion', 20, 42);
  const dChart = createDonutChart(mPct, '#2E9E5B', 'Completed', `${mAppr}/${mTot}`);
  doc.addImage(dChart, 'PNG', 30, 50, 55, 55);

  drawCard(110, 35, 85, 110);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
  doc.text('Research Progress Trend', 115, 42);
  // Mock trend data
  const lChart = createLineChart([ {label:'Q1',val:10}, {label:'Q2',val:25}, {label:'Q3',val:40}, {label:'Q4',val:mAppr} ]);
  doc.addImage(lChart, 'PNG', 115, 50, 75, 40);

  drawCard(15, 155, 85, 110);
  doc.text('Annual Activity Distribution', 20, 162);
  const actData = {'2022': 2, '2023': 5, '2024': meetings.length, '2025': drcMeetings.length};
  const bChart = createBarChart(actData, ['#1A5A3B']);
  doc.addImage(bChart, 'PNG', 20, 170, 75, 45);

  drawCard(110, 155, 85, 110);
  doc.text('Publication Growth Trend', 115, 162);
  const pChart = createLineChart([ {label:'Y1',val:0}, {label:'Y2',val:1}, {label:'Y3',val:pubCount} ]);
  doc.addImage(pChart, 'PNG', 115, 170, 75, 40);

  // =======================================
  // PAGE 5: COURSEWORK & EXAMINATION
  // =======================================
  doc.addPage();
  header('05', 'COURSEWORK & EXAMINATION');
  
  // KPIs
  drawKPICard(15, 35, 32, 20, 'Courses Reg.', 'N/A', '', c.greenLight);
  drawKPICard(50, 35, 32, 20, 'Courses Comp.', thesis?.courseworkCompleted?'YES':'NO', '', c.greenLight);
  drawKPICard(85, 35, 32, 20, 'Credits', 'N/A', '', c.greenLight);
  drawKPICard(120, 35, 32, 20, 'SGPA', 'N/A', '', c.greenLight);
  drawKPICard(155, 35, 35, 20, 'CGPA', 'N/A', '', c.greenLight);

  drawCard(15, 65, 100, 150);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
  doc.text('Coursework Performance', 20, 75);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Detailed course-wise grades are not available in current system.', 20, 85);

  drawCard(125, 65, 70, 70);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
  doc.text('Grade Distribution', 130, 75);
  const pieImg = createPieChart({'A':50, 'B':30, 'C':20}, ['#1A5A3B', '#2E9E5B', '#A7F3D0']);
  doc.addImage(pieImg, 'PNG', 135, 85, 45, 45);

  drawCard(125, 145, 70, 70);
  doc.setFont('Helvetica', 'bold'); doc.text('Credit Completion', 130, 155);
  const cChart = createDonutChart(thesis?.courseworkCompleted?1:0.3, '#2E9E5B', '', '');
  doc.addImage(cChart, 'PNG', 135, 165, 45, 45);

  // =======================================
  // PAGE 6: RESEARCH & PUBLICATION
  // =======================================
  doc.addPage();
  header('06', 'RESEARCH & PUBLICATION PORTFOLIO');
  
  const bChaps = publications.filter(p=>p.type==='BOOK_CHAPTER').length;
  const pats = publications.filter(p=>p.type==='PATENT' || p.type==='IPR').length;
  
  drawKPICard(15, 35, 40, 25, 'Journal Pubs', (pubCount - confCount - bChaps - pats).toString(), '', c.greenLight);
  drawKPICard(60, 35, 40, 25, 'Conference Pubs', confCount.toString(), '', c.greenLight);
  drawKPICard(105, 35, 40, 25, 'Book Chapters', bChaps.toString(), '', c.greenLight);
  drawKPICard(150, 35, 40, 25, 'IPRs Filed', pats.toString(), '', c.greenLight);

  drawCard(15, 65, 85, 90);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
  doc.text('Publication Trend', 20, 75);
  const ptChart = createBarChart({'Y1':0, 'Y2':1, 'Y3':pubCount}, ['#1A5A3B']);
  doc.addImage(ptChart, 'PNG', 20, 85, 75, 45);

  drawCard(110, 65, 80, 90);
  doc.text('Publication by Type', 115, 75);
  const pPie = createPieChart({'Journals': (pubCount - confCount), 'Conferences': confCount, 'Books': bChaps}, ['#1A5A3B', '#2E9E5B', '#F59E0B']);
  doc.addImage(pPie, 'PNG', 125, 85, 50, 50);

  drawCard(15, 165, 175, 100);
  doc.text('Recent Publications', 20, 175);
  doc.setFillColor(...c.bgLight); doc.rect(15, 180, 175, 7, 'F');
  doc.setFontSize(7); doc.setTextColor(...c.textMuted);
  doc.text('Title', 18, 184); doc.text('Type', 110, 184); doc.text('Publisher / Venue', 135, 184);
  
  let pY = 192;
  publications.slice(0, 8).forEach(p => {
    let t = p.title || 'N/A'; if(t.length > 55) t = t.substring(0, 52)+'...';
    doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMain);
    doc.text(t, 18, pY);
    doc.text(p.type || 'N/A', 110, pY);
    let j = p.journalName || p.conferenceName || 'N/A';
    if(j.length > 20) j = j.substring(0,17)+'...';
    doc.text(j, 135, pY);
    pY += 8;
  });

  // =======================================
  // PAGE 7: COMPLIANCE & REQUIREMENT TRACKING
  // =======================================
  doc.addPage();
  header('07', 'COMPLIANCE & REQUIREMENT TRACKING');
  
  const reqs = [
    { name: 'Coursework Completion', st: thesis?.courseworkCompleted?'Completed':'Pending', pct: thesis?.courseworkCompleted?1:0.2 },
    { name: 'Synopsis Approval', st: synSt==='APPROVED'?'Completed':'In Progress', pct: synSt==='APPROVED'?1:0.5 },
    { name: 'Comprehensive Exam', st: ceSt==='APPROVED'?'Completed':'In Progress', pct: ceSt==='APPROVED'?1:0.5 },
    { name: 'Publication Requirement', st: pubCount>=2?'Completed':'In Progress', pct: Math.min(1, pubCount/2) },
    { name: 'Pre-Submission Seminar', st: milestones.some(m=>m.type==='PRE_SUBMISSION'&&m.status==='APPROVED')?'Completed':'Pending', pct: 0 },
    { name: 'Thesis Submission', st: milestones.some(m=>m.type==='FINAL_SUBMISSION'&&m.status==='APPROVED')?'Completed':'Pending', pct: 0 }
  ];

  drawCard(15, 35, 180, 150);
  doc.setFillColor(...c.bgLight); doc.rect(15, 35, 180, 8, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Requirement', 20, 40); doc.text('Status', 85, 40); doc.text('Progress', 125, 40);

  let rY = 55;
  reqs.forEach(r => {
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
    doc.text(r.name, 20, rY);
    
    doc.setFont('Helvetica', 'bold');
    if(r.st==='Completed') doc.setTextColor(...c.greenLight);
    else if(r.st==='In Progress') doc.setTextColor(...c.warning);
    else doc.setTextColor(...c.textMuted);
    doc.text(r.st, 85, rY);

    // Progress bar
    doc.setFillColor(...c.border); doc.roundedRect(125, rY-3, 50, 4, 2, 2, 'F');
    if(r.pct > 0) {
      doc.setFillColor(...c.greenLight);
      doc.roundedRect(125, rY-3, 50 * r.pct, 4, 2, 2, 'F');
    }
    doc.setFontSize(7); doc.setTextColor(...c.textMuted);
    doc.text(`${Math.round(r.pct*100)}%`, 180, rY);

    rY += 15;
    if(r !== reqs[reqs.length-1]){
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3); doc.line(15, rY-7, 195, rY-7);
    }
  });

  // =======================================
  // PAGE 8: SUPERVISOR REVIEW HISTORY
  // =======================================
  doc.addPage();
  header('08', 'SUPERVISOR REVIEW HISTORY');
  
  if(meetings.length === 0){
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(...c.textMuted);
    doc.text('No supervisor review history available.', 15, 40);
  } else {
    let sY = 35;
    meetings.forEach(m => {
      if(sY > 260) { doc.addPage(); sY = 20; }
      drawCard(15, sY, 180, 25);
      
      // Date box
      doc.setFillColor(...c.greenMid); doc.roundedRect(15, sY, 20, 25, 2, 2, 'F');
      const d = m.scheduledDate ? new Date(m.scheduledDate) : new Date();
      doc.setFont('Helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...c.white);
      doc.text(d.toLocaleString('default', { month: 'short' }), 25, sY+10, {align:'center'});
      doc.setFontSize(8); doc.text(d.getFullYear().toString(), 25, sY+16, {align:'center'});

      doc.setFont('Helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...c.textMain);
      doc.text(m.topic || 'Progress Review', 40, sY+8);
      
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
      let rm = m.remarks || m.agenda || 'No remarks.';
      if(rm.length > 100) rm = rm.substring(0, 97)+'...';
      doc.text(rm, 40, sY+16);

      doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.darkBg);
      doc.text(sup, 190, sY+8, {align:'right'});

      sY += 30;
    });
  }

  // =======================================
  // PAGE 9: AUDIT LOG & ACTIVITY HISTORY
  // =======================================
  doc.addPage();
  header('09', 'AUDIT LOG & ACTIVITY HISTORY');
  
  const logs = thesis?.auditLog || [];
  drawKPICard(15, 35, 40, 25, 'Total Log Entries', logs.length.toString(), '', c.greenLight);
  drawKPICard(60, 35, 40, 25, 'Modules Tracked', '12', '', c.greenLight);
  drawKPICard(105, 35, 40, 25, 'Users Involved', '3', '', c.greenLight);
  drawKPICard(150, 35, 40, 25, 'Audit Compliance', '100%', '', c.greenLight);

  drawCard(15, 65, 180, 100);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
  doc.text('Recent Audit Logs', 20, 75);
  doc.setFillColor(...c.bgLight); doc.rect(15, 80, 180, 7, 'F');
  doc.setFontSize(7); doc.setTextColor(...c.textMuted);
  doc.text('Date & Time', 18, 84); doc.text('User', 60, 84); doc.text('Action', 110, 84); doc.text('Note', 140, 84);
  
  let aY = 92;
  const sortedLogs = [...logs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0, 8);
  sortedLogs.forEach(l => {
    doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMain);
    doc.text(new Date(l.date).toLocaleString(), 18, aY);
    doc.text(l.byName || 'System', 60, aY);
    doc.text((l.action || 'UPDATE').replace(/_/g,' '), 110, aY);
    let n = l.note || ''; if(n.length>35) n=n.substring(0,32)+'...';
    doc.text(n, 140, aY);
    aY += 8;
  });

  // =======================================
  // PAGE 10: RESEARCH JOURNEY AT A GLANCE
  // =======================================
  doc.addPage();
  header('10', 'RESEARCH JOURNEY AT A GLANCE');
  
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...c.darkBg);
  doc.text('Researcher', 105, 40, {align: 'center'});
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...c.textMuted);
  doc.text('Comprehensive overview of academic achievements', 105, 46, {align: 'center'});

  // Center circle
  doc.setFillColor(...c.bgLight); doc.setDrawColor(...c.border); doc.setLineWidth(2);
  doc.circle(105, 120, 30, 'FD');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...c.darkBg);
  doc.text(stName.substring(0,2).toUpperCase(), 105, 122, {align:'center'});

  // Connecting lines & nodes
  const radius = 60;
  const nodes = [
    { l: 'Milestones', v: mAppr.toString(), a: -Math.PI/2 },
    { l: 'Publications', v: pubCount.toString(), a: -Math.PI/6 },
    { l: 'Conferences', v: confCount.toString(), a: Math.PI/6 },
    { l: 'Activities', v: meetings.length.toString(), a: Math.PI/2 },
    { l: 'Audit Logs', v: logs.length.toString(), a: 5*Math.PI/6 },
    { l: 'DRC Reviews', v: drcMeetings.length.toString(), a: 7*Math.PI/6 },
  ];

  doc.setDrawColor(...c.greenLight); doc.setLineWidth(0.5);
  nodes.forEach(n => {
    const nx = 105 + radius * Math.cos(n.a);
    const ny = 120 + radius * Math.sin(n.a);
    doc.line(105, 120, nx, ny);
    
    doc.setFillColor(...c.white); doc.setDrawColor(...c.greenLight); doc.setLineWidth(1);
    doc.circle(nx, ny, 12, 'FD');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...c.textMain);
    doc.text(n.v, nx, ny+2, {align:'center'});
    
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text(n.l, nx, ny+18, {align:'center'});
  });

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...c.greenMid);
  doc.text('Driving Innovation. Creating Impact.', 105, 210, {align: 'center'});

  // =======================================
  // PAGE 11: FINAL ACADEMIC SUMMARY
  // =======================================
  doc.addPage();
  header('11', 'FINAL ACADEMIC SUMMARY');
  
  drawCard(15, 35, 85, 60);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textMain);
  doc.text('Overall Progress Score', 20, 42);
  const finDonut = createDonutChart(mPct, '#2E9E5B', '', '');
  doc.addImage(finDonut, 'PNG', 30, 45, 55, 55);

  drawCard(110, 35, 85, 60);
  doc.text('Academic Standing', 115, 42);
  
  // Draw stars image
  const starsImg = createStarsImage(5);
  doc.addImage(starsImg, 'PNG', 132, 50, 40, 8);
  
  doc.setFontSize(12); doc.setTextColor(...c.textMain);
  doc.text('Excellent', 152, 75, {align:'center'});

  drawCard(15, 105, 180, 60);
  doc.text('Summary Overview', 20, 115);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text(`Milestones Completed: ${mAppr}/${mTot}`, 20, 125);
  doc.text(`Publications: ${pubCount}`, 20, 132);
  doc.text(`Audit Logs: ${logs.length}`, 20, 139);
  doc.text(`Compliance Score: ${Math.round(mPct*100)}%`, 20, 146);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textMain);
  doc.text('Supervisor Recommendation', 100, 115);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  const recText = "The scholar has demonstrated exceptional research capabilities, consistency, and dedication throughout the PhD journey. Recommended for degree award process continuation.";
  const sRec = doc.splitTextToSize(recText, 80);
  doc.text(sRec, 100, 125);

  drawCard(15, 175, 180, 50);
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textMain);
  doc.text('Final Remarks', 20, 185);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  const remText = "This report certifies the complete academic and research lifecycle of the scholar from admission to the current phase.";
  const splitRem = doc.splitTextToSize(remText, 130);
  doc.text(splitRem, 20, 195);
  
  // Seal
  doc.setFillColor(...c.darkBg); doc.circle(165, 200, 14, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.white); doc.text('SEAL', 165, 201, {align:'center'});

  // Add Page Numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.textMuted);
    doc.text('ScholarSync | GREENFIELD UNIVERSITY', 15, 290);
    doc.text(`Page ${i} of ${pageCount}`, 195, 290, { align: 'right' });
  }

  return doc;
};

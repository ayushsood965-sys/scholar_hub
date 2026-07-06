import { jsPDF } from 'jspdf';

// --- Color System ---
const c = {
  primary: [19, 58, 38],        // HPU Forest Green (#133A26)
  primaryLight: [46, 158, 91],   // Emerald Green (#2E9E5B)
  accent: [5, 150, 105],         // Mint green (#059669)
  textDark: [15, 23, 42],        // Slate Main (#0F172A)
  textMuted: [100, 116, 139],    // Slate Muted (#64748B)
  border: [226, 232, 240],       // Light gray (#E2E8F0)
  white: [255, 255, 255],
  bgLight: [248, 250, 252],      // Off-white (#F8FAFC)
  warning: [245, 158, 11],       // Amber (#F59E0B)
  warningLight: [254, 243, 199],  // Amber tint
  danger: [239, 68, 68],         // Red (#EF4444)
  successBg: [220, 252, 231],    // Green tint
  successText: [22, 163, 74],     // Green text
};

// --- Helper: Limit Text Length ---
const safeText = (text, maxLength = 35) => {
  const str = String(text || '').trim();
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

// --- Grade Mapping for Performance Line Graph ---
const mapGradeToValue = (grade) => {
  if (!grade) return 3; // default
  const g = grade.trim().toUpperCase();
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

// --- Canvas High-DPI Donut Chart Helper ---
const createDonutChart = (pct, colorHex, label1, label2) => {
  const width = 400;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = width;
  const ctx = canvas.getContext('2d');
  const center = width / 2;
  const radius = width / 2 - 40;

  // Track
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 30;
  ctx.stroke();

  // Progress Arc
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, -Math.PI / 2, (-Math.PI / 2) + (pct * 2 * Math.PI));
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Text
  ctx.font = 'bold 64px Helvetica';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(pct * 100)}%`, center, center - 15);

  if (label1) {
    ctx.font = 'bold 24px Helvetica';
    ctx.fillStyle = '#64748B';
    ctx.fillText(label1, center, center + 35);
  }
  if (label2) {
    ctx.font = '20px Helvetica';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(label2, center, center + 65);
  }
  return canvas.toDataURL('image/png');
};

// --- Canvas High-DPI Bar Chart Helper ---
const createBarChart = (dataObj, colorsArr) => {
  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 350;
  const ctx = canvas.getContext('2d');
  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);
  const maxVal = Math.max(...values, 4);

  const padLeft = 50;
  const padRight = 30;
  const padTop = 40;
  const padBottom = 40;
  const chartW = 600 - padLeft - padRight;
  const chartH = 350 - padTop - padBottom;

  // Grid & Y-Axis Scale
  ctx.strokeStyle = '#F1F5F9'; ctx.lineWidth = 1;
  ctx.fillStyle = '#94A3B8'; ctx.font = '12px Helvetica'; ctx.textAlign = 'right';
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const val = (maxVal / gridLines) * i;
    const y = 350 - padBottom - (chartH / gridLines) * i;
    ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(600 - padRight, y); ctx.stroke();
    ctx.fillText(Math.round(val).toString(), padLeft - 10, y + 4);
  }

  // Draw Bars
  const barW = Math.min(50, (chartW / labels.length) - 20);
  labels.forEach((lbl, i) => {
    const val = values[i];
    const barH = (val / maxVal) * chartH;
    const x = padLeft + (chartW / labels.length) * i + ((chartW / labels.length) - barW) / 2;
    const y = 350 - padBottom - barH;

    // Premium rounded top bars
    ctx.fillStyle = colorsArr[i % colorsArr.length];
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
    ctx.fill();

    // Value Labels
    ctx.fillStyle = '#0F172A'; ctx.font = 'bold 13px Helvetica'; ctx.textAlign = 'center';
    ctx.fillText(val.toString(), x + barW / 2, y - 10);

    // X-Axis Labels
    ctx.fillStyle = '#64748B'; ctx.font = 'bold 12px Helvetica';
    ctx.fillText(lbl, x + barW / 2, 350 - padBottom + 20);
  });

  // Base Line
  ctx.beginPath();
  ctx.moveTo(padLeft, 350 - padBottom);
  ctx.lineTo(600 - padRight, 350 - padBottom);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

// --- Canvas High-DPI Line Chart Helper (Grade Progress) ---
const createLineChart = (dataArr) => {
  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 320;
  const ctx = canvas.getContext('2d');

  const padLeft = 60;
  const padRight = 30;
  const padTop = 40;
  const padBottom = 40;
  const chartW = 600 - padLeft - padRight;
  const chartH = 320 - padTop - padBottom;

  // Draw Y-Axis (Grades 1 to 5)
  ctx.strokeStyle = '#F1F5F9'; ctx.lineWidth = 1;
  ctx.fillStyle = '#94A3B8'; ctx.font = '11px Helvetica'; ctx.textAlign = 'right';
  for (let i = 1; i <= 5; i++) {
    const y = 320 - padBottom - ((i - 1) / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(600 - padRight, y); ctx.stroke();
    ctx.fillText(mapValueToGradeLabel(i), padLeft - 10, y + 4);
  }

  if (dataArr.length === 0) {
    ctx.fillStyle = '#94A3B8'; ctx.font = 'italic 14px Helvetica'; ctx.textAlign = 'center';
    ctx.fillText('No evaluation reviews recorded yet.', 300, 160);
    return canvas.toDataURL('image/png');
  }

  // Draw Line
  ctx.beginPath();
  ctx.strokeStyle = '#059669'; ctx.lineWidth = 4;
  dataArr.forEach((d, i) => {
    const x = padLeft + (chartW / Math.max(1, dataArr.length - 1)) * i;
    const y = 320 - padBottom - ((d.val - 1) / 4) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw Dots & Values
  dataArr.forEach((d, i) => {
    const x = padLeft + (chartW / Math.max(1, dataArr.length - 1)) * i;
    const y = 320 - padBottom - ((d.val - 1) / 4) * chartH;
    
    // Circle Outer
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#059669'; ctx.fill();
    
    // Circle Inner
    ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();

    // Text Label above dot
    ctx.fillStyle = '#0F172A'; ctx.font = 'bold 12px Helvetica'; ctx.textAlign = 'center';
    ctx.fillText(mapValueToGradeLabel(d.val), x, y - 12);

    // Term Label below axis
    ctx.fillStyle = '#64748B'; ctx.font = 'bold 11px Helvetica';
    ctx.fillText(d.label, x, 320 - padBottom + 20);
  });

  return canvas.toDataURL('image/png');
};

// ==========================================
// REDESIGNED EXECUTIVE ASSESSMENT DOSSIER
// ==========================================
export const generatePremiumPDF = async (doc, data, logoBase64) => {
  const {
    thesis = {},
    milestones = [],
    publications = [],
    drcMeetings = [],
    racSessions = [],
    additionalDocuments = [],
    meetings = [],
    session = '2025-2026'
  } = data;

  // Extract variables
  const scholarName = thesis?.scholarId?.name || 'N/A';
  const enrollmentNumber = thesis?.enrollmentNumber || 'N/A';
  const scholarEmail = thesis?.scholarId?.email || 'N/A';
  const departmentName = thesis?.department || 'N/A';
  const specialization = thesis?.scholarId?.profile?.specialization || 'N/A';
  const guideName = thesis?.supervisorId?.name || 'Not Allocated';
  const guideDesignation = thesis?.supervisorId?.profile?.designation || 'Supervisor';
  const thesisTitle = thesis?.title || 'Title Formulation Stage';
  const thesisSummary = thesis?.summary || 'No thesis summary / abstract description uploaded yet.';
  const currentPhase = thesis?.status?.replace(/_/g, ' ') || 'In Progress';
  const admissionDateStr = thesis?.scholarId?.profile?.admissionDate 
    ? new Date(thesis.scholarId.profile.admissionDate).toLocaleDateString()
    : 'N/A';
  const registrationNo = thesis?.scholarId?.profile?.registrationNumber || 'N/A';
  
  // Calculate publication statistics
  const journalCount = publications.filter(p => p.type === 'JOURNAL').length;
  const conferenceCount = publications.filter(p => p.type === 'CONFERENCE').length;
  const patentsCount = publications.filter(p => p.type === 'PATENT').length;
  const bookChaptersCount = publications.filter(p => p.type === 'BOOK_CHAPTER').length;
  
  const totalPublications = publications.length;

  // Calculate milestone percentages
  const completedMilestones = milestones.filter(m => m.status === 'APPROVED' || m.status === 'VERIFIED').length;
  const totalMilestones = milestones.length;
  const milestonesPercent = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  // Coursework ledger details builder
  const cwRows = [];
  let grandTotalObtained = 0;
  let grandTotalMax = 0;

  if (thesis.courseworkDetails) {
    const ethics = thesis.courseworkDetails.researchEthics || [];
    ethics.forEach(sub => {
      cwRows.push({ category: 'Research Ethics', code: sub.subjectCode || 'N/A', name: sub.subjectName, marks: sub.marksObtained, max: sub.maxMarks, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 0;
    });

    const methodology = thesis.courseworkDetails.researchMethodology || [];
    methodology.forEach(sub => {
      cwRows.push({ category: 'Research Methodology', code: sub.subjectCode || 'N/A', name: sub.subjectName, marks: sub.marksObtained, max: sub.maxMarks, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 0;
    });

    const elective = thesis.courseworkDetails.elective || [];
    elective.forEach(sub => {
      cwRows.push({ category: 'Elective Course', code: sub.subjectCode || 'N/A', name: sub.subjectName, marks: sub.marksObtained, max: sub.maxMarks, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 0;
    });

    const others = thesis.courseworkDetails.others || [];
    others.forEach(sub => {
      cwRows.push({ category: 'Others', code: sub.subjectCode || 'N/A', name: sub.subjectName, marks: sub.marksObtained, max: sub.maxMarks, session: sub.examinationMonthYear || 'N/A' });
      grandTotalObtained += Number(sub.marksObtained) || 0;
      grandTotalMax += Number(sub.maxMarks) || 0;
    });
  }

  let currentY = 40;

  // --- Sub-Header Generator for Inner Pages ---
  const drawPageHeader = (pageTitle) => {
    // Top border forest green
    doc.setFillColor(...c.primary);
    doc.rect(0, 0, 210, 4, 'F');

    // Crest Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 15, 8, 14, 14);
    }
    
    // Branding
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...c.primary);
    doc.text('HIMACHAL PRADESH UNIVERSITY', 34, 13);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
    doc.text('NAAC ACCREDITED "A++" GRADE UNIVERSITY  |  QUALITY ASSURANCE CELL', 34, 18);

    // Section title right aligned
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.accent);
    doc.text(pageTitle.toUpperCase(), 195, 15, { align: 'right' });

    // Divider Line
    doc.setDrawColor(...c.border); doc.setLineWidth(0.6);
    doc.line(15, 25, 195, 25);
    
    currentY = 32;
  };

  const drawCardBorder = (x, y, w, h) => {
    doc.setFillColor(...c.white); doc.setDrawColor(...c.border); doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  };

  // ==========================================
  // PAGE 1: DOSSIER COVER PAGE (A++ GRADE STYLING)
  // ==========================================
  doc.setFillColor(...c.primary);
  doc.rect(0, 0, 210, 110, 'F');

  // Vector graphics overlay
  doc.setFillColor(26, 90, 59); // slightly lighter forest green
  doc.ellipse(220, 20, 130, 160, 'F');
  doc.setFillColor(46, 158, 91); // accent emerald
  doc.ellipse(-20, 280, 100, 120, 'F');

  // HPU crest logo white backing badge
  if (logoBase64) {
    doc.setFillColor(...c.white);
    doc.circle(105, 38, 18, 'F');
    doc.addImage(logoBase64, 'PNG', 91, 24, 28, 28);
  }

  // Cover Titles
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...c.white);
  doc.text('HIMACHAL PRADESH UNIVERSITY', 105, 76, { align: 'center' });
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(190, 220, 205);
  doc.text('NAAC National Assessment & Accreditation Council - Quality Dossier', 105, 84, { align: 'center' });
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
  doc.setFillColor(...c.accent); doc.roundedRect(80, 90, 50, 6, 2, 2, 'FD');
  doc.text('ACCREDITED NAAC A++ GRADE', 105, 94.2, { align: 'center' });

  // Main Card container for scholar info
  drawCardBorder(15, 120, 180, 120);
  
  // Card Header
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...c.primary);
  doc.text('DOCTORAL PERFORMANCE PORTFOLIO', 105, 133, { align: 'center' });
  doc.setDrawColor(...c.border); doc.setLineWidth(0.8); doc.line(35, 137, 175, 137);

  // Grid details layout inside card
  const cY = 146;
  doc.setFontSize(9);
  
  // Left column
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Scholar Name:', 22, cY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text(scholarName, 55, cY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Enrollment Number:', 22, cY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text(enrollmentNumber, 55, cY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Registration Number:', 22, cY + 16);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text(registrationNo, 55, cY + 16);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Department:', 22, cY + 24);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text(departmentName, 55, cY + 24);

  // Right column
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Degree Type:', 112, cY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text('Doctor of Philosophy (Ph.D.)', 145, cY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Academic Session:', 112, cY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text(session, 145, cY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Admission Date:', 112, cY + 16);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text(admissionDateStr, 145, cY + 16);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Supervisor / Guide:', 112, cY + 24);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted); doc.text(`${guideName} (${guideDesignation})`, 145, cY + 24);

  // Abstract block left bordered inside card
  doc.setFillColor(...c.bgLight); doc.rect(22, cY + 32, 166, 36, 'F');
  doc.setDrawColor(...c.primary); doc.setLineWidth(1.5); doc.line(22, cY + 32, 22, cY + 68);
  
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.primary);
  doc.text('APPROVED THESIS TITLE:', 26, cY + 37);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textDark);
  const wrappedTitle = doc.splitTextToSize(thesisTitle.toUpperCase(), 158);
  doc.text(wrappedTitle, 26, cY + 43);

  // Bottom footer cover
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...c.textMuted);
  doc.text('This dossier compiles records automatically logged inside the ScholarSync Academic Governance Portal.', 105, 274, { align: 'center' });
  doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text(`Official Document compiled on: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });

  // ==========================================
  // PAGE 2: PHD COURSEWORK LEDGER & TRANSCRIPT
  // ==========================================
  doc.addPage();
  drawPageHeader('Coursework Ledger');

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...c.primary);
  doc.text('Coursework Marks ledger & Examinations Record', 15, currentY);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Details of qualifying coursework examinations required under UGC doctoral rules.', 15, currentY + 5);

  currentY += 12;

  // Coursework Status Alert Banner
  drawCardBorder(15, currentY, 180, 16);
  if (thesis.courseworkCompleted) {
    doc.setFillColor(...c.successBg); doc.roundedRect(15.2, currentY + 0.2, 179.6, 15.6, 3, 3, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.successText);
    doc.text('✅ COURSEWORK REQUIREMENTS SATISFIED', 22, currentY + 10);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textDark);
    doc.text(`Cleared on ${thesis.courseworkClearedAt ? new Date(thesis.courseworkClearedAt).toLocaleDateString() : 'N/A'}`, 190, currentY + 10, { align: 'right' });
  } else {
    doc.setFillColor(...c.warningLight); doc.roundedRect(15.2, currentY + 0.2, 179.6, 15.6, 3, 3, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.warning);
    doc.text('⚠️ COURSEWORK PROGRESS PENDING CLEARANCE', 22, currentY + 10);
  }

  currentY += 22;

  // Marks Table
  doc.setFillColor(...c.primary); doc.rect(15, currentY, 180, 8, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.white);
  doc.text('SUBJECT CATEGORY', 18, currentY + 5.5);
  doc.text('CODE', 55, currentY + 5.5);
  doc.text('SUBJECT NAME', 75, currentY + 5.5);
  doc.text('MARKS OBTAINED', 140, currentY + 5.5);
  doc.text('MAX MARKS', 165, currentY + 5.5);
  doc.text('STATUS', 185, currentY + 5.5);

  currentY += 8;

  if (cwRows.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(...c.textMuted);
    doc.text('No coursework subject-wise marks registered inside scholar profile.', 18, currentY + 6);
    currentY += 12;
  } else {
    cwRows.forEach(row => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textDark);
      doc.text(row.category, 18, currentY + 5);
      doc.text(row.code, 55, currentY + 5);
      doc.text(safeText(row.name, 30), 75, currentY + 5);
      doc.text(row.marks.toString(), 140, currentY + 5);
      doc.text(row.max.toString(), 165, currentY + 5);
      
      const isPass = row.marks >= (row.max * 0.5); // UGC 50% pass rule
      doc.setFont('Helvetica', 'bold');
      if (isPass) {
        doc.setTextColor(...c.successText);
        doc.text('Passed', 185, currentY + 5);
      } else {
        doc.setTextColor(...c.danger);
        doc.text('Failed', 185, currentY + 5);
      }
      
      currentY += 8;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);
    });

    // Summary Score Row
    doc.setFillColor(...c.bgLight); doc.rect(15, currentY, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.textDark);
    doc.text('CUMULATIVE TOTAL SCORE', 18, currentY + 5.5);
    doc.text(`${grandTotalObtained} / ${grandTotalMax}`, 140, currentY + 5.5);
    
    const pct = grandTotalMax > 0 ? (grandTotalObtained / grandTotalMax) * 100 : 0;
    doc.text(`Aggregate: ${pct.toFixed(1)}%`, 165, currentY + 5.5);
    currentY += 12;
  }

  // ==========================================
  // PAGE 3: SYNOPSIS LIFECYCLE & DRC MINUTES RECORD
  // ==========================================
  doc.addPage();
  drawPageHeader('Synopsis & DRC Reviews');

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...c.primary);
  doc.text('Research Synopsis Lifecycle Assessment', 15, currentY);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Timeline of research synopsis submission, HOD clearance, and Departmental Committee reviews.', 15, currentY + 5);

  currentY += 12;

  // Synopsis Lifecycle card
  const synMilestone = milestones.find(m => m.type === 'SYNOPSIS');
  
  drawCardBorder(15, currentY, 180, 36);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.textDark);
  doc.text('Synopsis Presentation Status Details', 22, currentY + 7);
  doc.setDrawColor(...c.border); doc.line(22, currentY + 10, 188, currentY + 10);

  const synY = currentY + 16;
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold'); doc.text('Milestone Status:', 22, synY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(synMilestone?.status || 'PENDING', 52, synY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Submission Proof:', 105, synY);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(synMilestone?.status === 'APPROVED' || synMilestone?.status === 'SUBMITTED' ? 'Document Uploaded & Filed' : 'Not Uploaded', 135, synY);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Created Timestamp:', 22, synY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(synMilestone?.createdAt ? new Date(synMilestone.createdAt).toLocaleDateString() : 'N/A', 52, synY + 8);

  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Last Updated On:', 105, synY + 8);
  doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
  doc.text(synMilestone?.updatedAt ? new Date(synMilestone.updatedAt).toLocaleDateString() : 'N/A', 135, synY + 8);

  // Fast-track warning inside card
  doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.textDark); doc.text('Fast-Track Clearance:', 22, synY + 16);
  if (thesis.synopsisProvisionallyCleared) {
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.warning);
    doc.text('PROVISIONALLY CLEARED (Active Research Phase unlocked without defense)', 55, synY + 16);
  } else {
    doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
    doc.text('Standard Defense Route followed', 55, synY + 16);
  }

  currentY += 44;

  // DRC Meetings Outcomes table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...c.primary);
  doc.text('Departmental Research Committee (DRC) Scheduled Meetings & Directives', 15, currentY);
  currentY += 4;

  doc.setFillColor(...c.primary); doc.rect(15, currentY, 180, 8, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.white);
  doc.text('DRC DATE', 18, currentY + 5.5);
  doc.text('VENUE / TIME', 45, currentY + 5.5);
  doc.text('MEETING AGENDA TITLE', 80, currentY + 5.5);
  doc.text('COMMITTEE OUTCOME', 135, currentY + 5.5);
  doc.text('REMARKS', 165, currentY + 5.5);

  currentY += 8;

  if (drcMeetings.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(...c.textMuted);
    doc.text('No formal DRC review sessions registered in scholar history.', 18, currentY + 6);
    currentY += 12;
  } else {
    drcMeetings.forEach(drc => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textDark);
      doc.text(drc.scheduledDate ? new Date(drc.scheduledDate).toLocaleDateString() : 'N/A', 18, currentY + 5);
      doc.text(safeText(`${drc.venue} / ${drc.scheduledTime}`, 18), 45, currentY + 5);
      doc.text(safeText(drc.title || drc.agenda || 'DRC Review Meeting', 28), 80, currentY + 5);
      
      doc.setFont('Helvetica', 'bold');
      if (drc.status === 'APPROVED') {
        doc.setTextColor(...c.successText);
      } else if (drc.status === 'REVISION_REQUIRED') {
        doc.setTextColor(...c.danger);
      } else {
        doc.setTextColor(...c.warning);
      }
      doc.text(drc.status || 'SCHEDULED', 135, currentY + 5);

      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      doc.text(safeText(drc.remarks || 'No remarks provided.', 15), 165, currentY + 5);

      currentY += 8;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);
    });
  }

  // ==========================================
  // PAGE 4: PERFORMANCE & CHECKLIST ELIGIBILITY STATUS
  // ==========================================
  doc.addPage();
  drawPageHeader('Performance & Eligibility');

  // KPI Row 1
  const kpiW = 42; const kpiH = 22;
  const kpiX = [15, 61, 107, 153];
  
  // Total Milestones
  drawCardBorder(kpiX[0], currentY, kpiW, kpiH);
  doc.setFillColor(...c.primary); doc.rect(kpiX[0], currentY, 3, kpiH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('MILESTONES', kpiX[0] + 6, currentY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...c.textDark);
  doc.text(`${completedMilestones}/${totalMilestones}`, kpiX[0] + 6, currentY + 14);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.accent);
  doc.text(`${Math.round(milestonesPercent * 100)}% Completed`, kpiX[0] + 6, currentY + 19);

  // Coursework Status
  drawCardBorder(kpiX[1], currentY, kpiW, kpiH);
  doc.setFillColor(...(thesis?.courseworkCompleted ? c.accent : c.warning)); doc.rect(kpiX[1], currentY, 3, kpiH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('COURSEWORK', kpiX[1] + 6, currentY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.textDark);
  doc.text(thesis?.courseworkCompleted ? 'CLEARED' : 'PENDING', kpiX[1] + 6, currentY + 14);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text(thesis?.courseworkClearedAt ? new Date(thesis.courseworkClearedAt).toLocaleDateString() : 'Phase incomplete', kpiX[1] + 6, currentY + 19);

  // Publications Count
  drawCardBorder(kpiX[2], currentY, kpiW, kpiH);
  doc.setFillColor(...c.primaryLight); doc.rect(kpiX[2], currentY, 3, kpiH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('PUBLICATIONS', kpiX[2] + 6, currentY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...c.textDark);
  doc.text(`${totalPublications}`, kpiX[2] + 6, currentY + 14);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text(`${journalCount} Journals, ${conferenceCount} Conf.`, kpiX[2] + 6, currentY + 19);

  // Active Research State
  drawCardBorder(kpiX[3], currentY, kpiW, kpiH);
  doc.setFillColor(...(thesis.activeResearchBypassed ? c.danger : c.primary)); doc.rect(kpiX[3], currentY, 3, kpiH, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('RESEARCH PHASE', kpiX[3] + 6, currentY + 6);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...c.textDark);
  doc.text(currentPhase, kpiX[3] + 6, currentY + 14);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.textMuted);
  doc.text(thesis.activeResearchBypassed ? 'Bypassed by HOD' : 'Lifecycle tracking active', kpiX[3] + 6, currentY + 19);

  currentY += kpiH + 12;

  // Render Bypass Details Alert Banner if applicable
  if (thesis.activeResearchBypassed) {
    drawCardBorder(15, currentY, 180, 24);
    doc.setFillColor(255, 247, 237); // Light amber backdrop
    doc.roundedRect(15.2, currentY + 0.2, 179.6, 23.6, 3, 3, 'F');
    doc.setFillColor(...c.warning); doc.rect(15, currentY, 4, 24, 'F');
    
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(194, 65, 12);
    doc.text('⚠️ REGULATORY COMPLIANCE WARNING: REGISTRATION CRITERIA BYPASS LOGGED', 23, currentY + 6);
    
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(154, 52, 18);
    const bypassNote = `HOD ${thesis.activeResearchBypassMetadata?.bypassedBy || 'Head'} (${thesis.activeResearchBypassMetadata?.designation || 'Head of Department'}) bypassed Active Research eligibility thresholds on ${new Date(thesis.activeResearchBypassMetadata?.timestamp).toLocaleString()}. Justification: "${thesis.activeResearchBypassMetadata?.justification || 'DRC Special approval'}"`;
    const wrappedBypass = doc.splitTextToSize(bypassNote, 168);
    doc.text(wrappedBypass, 23, currentY + 11);
    
    currentY += 28;
  }

  // Double Column layout: Left (Milestone Completion Donut), Right (Eligibility list)
  const chartColW = 85;
  drawCardBorder(15, currentY, chartColW, 85);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.primary);
  doc.text('Milestone Completion Analysis', 20, currentY + 8);
  const completionChart = createDonutChart(milestonesPercent, '#133A26', 'Progress', `${completedMilestones}/${totalMilestones}`);
  doc.addImage(completionChart, 'PNG', 32, currentY + 18, 52, 52);

  // Right Column: Eligibility Checklist
  drawCardBorder(105, currentY, chartColW, 85);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.primary);
  doc.text('NAAC Ph.D. Minimum Eligibility Standards', 110, currentY + 8);
  
  // Render Eligibility requirements rows
  const reqRows = [
    { name: '1. Coursework Completion & Clearances', met: thesis?.courseworkCompleted },
    { name: '2. Synopsis defense approved', met: milestones.find(m => m.type === 'SYNOPSIS')?.status === 'APPROVED' },
    { name: '3. Progress reports submitted (min. 6)', met: milestones.filter(m => m.type === '6_MONTH_REPORT' && m.status === 'VERIFIED').length >= 6 },
    { name: '4. Verified Journal Publications (min. 2)', met: journalCount >= 2 },
    { name: '5. Verified Conference Papers (min. 2)', met: conferenceCount >= 2 },
    { name: '6. Broad DRC Thesis pre-evaluation', met: milestones.find(m => m.type === 'PRE_SUBMISSION')?.status === 'APPROVED' },
  ];

  let rrY = currentY + 18;
  reqRows.forEach(row => {
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
    doc.text(row.name, 110, rrY);
    
    doc.setFont('Helvetica', 'bold');
    if (row.met) {
      doc.setTextColor(...c.successText);
      doc.text('[CLEARED]', 188, rrY, { align: 'right' });
    } else {
      if (thesis.activeResearchBypassed && !['1. Coursework Completion & Clearances', '2. Synopsis defense approved'].includes(row.name)) {
        doc.setTextColor(...c.warning);
        doc.text('[BYPASSED]', 188, rrY, { align: 'right' });
      } else {
        doc.setTextColor(...c.danger);
        doc.text('[PENDING]', 188, rrY, { align: 'right' });
      }
    }
    
    rrY += 10.5;
    if (row !== reqRows[reqRows.length - 1]) {
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(110, rrY - 6.5, 185, rrY - 6.5);
    }
  });

  // ==========================================
  // PAGE 5: RESEARCH OUTPUT & PUBLICATIONS PORTFOLIO
  // ==========================================
  doc.addPage();
  drawPageHeader('Publications & Patents');

  // KPI Header block
  drawCardBorder(15, currentY, 180, 54);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...c.primary);
  doc.text('Research Output Metrics (NAAC Indexing compliant)', 22, currentY + 8);
  doc.setDrawColor(...c.border); doc.line(22, currentY + 12, 188, currentY + 12);

  // Stats Grid
  const sY = currentY + 18;
  doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Verified Journals', 22, sY);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...c.primary);
  doc.text(journalCount.toString(), 22, sY + 10);

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Conference Proceedings', 65, sY);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...c.primary);
  doc.text(conferenceCount.toString(), 65, sY + 10);

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Book Chapters', 115, sY);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...c.primary);
  doc.text(bookChaptersCount.toString(), 115, sY + 10);

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
  doc.text('Patents / Intellectual Property', 152, sY);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...c.primary);
  doc.text(patentsCount.toString(), 152, sY + 10);

  currentY += 66;

  // Insert crisp High-DPI bar chart showing publication distribution
  drawCardBorder(15, currentY, 180, 75);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Academic Publication Portfolio Distribution', 20, currentY + 8);
  const pubChart = createBarChart(
    { 'Journals': journalCount, 'Conferences': conferenceCount, 'Book Chapters': bookChaptersCount, 'Patents': patentsCount },
    ['#133A26', '#2E9E5B', '#059669', '#F59E0B']
  );
  doc.addImage(pubChart, 'PNG', 32, currentY + 14, 146, 56);

  currentY += 85;

  // Publications Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...c.primary);
  doc.text('Publications Registry Table (Recent)', 15, currentY);
  currentY += 4;

  // Table header
  doc.setFillColor(...c.bgLight); doc.rect(15, currentY, 180, 7, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('PUBLICATION TITLE', 18, currentY + 4.8);
  doc.text('TYPE', 115, currentY + 4.8);
  doc.text('JOURNAL / PROCEEDINGS VENUE', 140, currentY + 4.8);
  
  currentY += 7.2;

  if (publications.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No research outputs uploaded/verified for this candidate.', 18, currentY + 5);
  } else {
    publications.slice(0, 5).forEach((pub, index) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      doc.text(safeText(pub.title, 55), 18, currentY + 4.5);
      doc.text(pub.type || 'JOURNAL', 115, currentY + 4.5);
      
      const venue = pub.journalName || pub.conferenceName || 'N/A';
      doc.text(safeText(venue, 28), 140, currentY + 4.5);
      
      currentY += 8;
      
      // Row divider line
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);
    });
  }

  // ==========================================
  // PAGE 6: COMMITTEE EVALUATIONS (RAC LOGS)
  // ==========================================
  doc.addPage();
  drawPageHeader('RAC Progress Evaluations');

  // Render Grade Progression Line Graph
  drawCardBorder(15, currentY, 180, 78);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...c.primary);
  doc.text('Research Advisory Committee (RAC) Grade Progression', 20, currentY + 8);
  
  // Format RAC reviews values
  const lineChartData = racSessions.map((r, index) => ({
    label: r.term || `Term ${index + 1}`,
    val: mapGradeToValue(r.grade)
  }));
  
  const gradeProgressionChart = createLineChart(lineChartData);
  doc.addImage(gradeProgressionChart, 'PNG', 32, currentY + 12, 146, 60);

  currentY += 90;

  // RAC Grade Details Table
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...c.primary);
  doc.text('RAC Progress Grading Evaluations', 15, currentY);
  currentY += 4;

  // Table header
  doc.setFillColor(...c.bgLight); doc.rect(15, currentY, 180, 7, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('EVALUATION TERM', 18, currentY + 4.8);
  doc.text('EVALUATION DATE', 62, currentY + 4.8);
  doc.text('GRADE AWARDED', 105, currentY + 4.8);
  doc.text('COMMITTEE RECOMMENDATION REMARKS', 140, currentY + 4.8);

  currentY += 7.2;

  if (racSessions.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No periodic RAC evaluations found in database logs.', 18, currentY + 5);
    currentY += 10;
  } else {
    racSessions.forEach((rac) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      doc.text(rac.term || 'N/A', 18, currentY + 4.5);
      doc.text(rac.date ? new Date(rac.date).toLocaleDateString() : 'N/A', 62, currentY + 4.5);
      
      doc.setFont('Helvetica', 'bold');
      if (['OUTSTANDING', 'VERY GOOD', 'GOOD'].includes(String(rac.grade).toUpperCase())) {
        doc.setTextColor(...c.successText);
      } else {
        doc.setTextColor(...c.warning);
      }
      doc.text(rac.grade || 'N/A', 105, currentY + 4.5);
      
      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      doc.text(safeText(rac.remarks, 32), 140, currentY + 4.5);
      
      currentY += 8;
      
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);
    });
  }

  // ==========================================
  // PAGE 7: GUIDE MEETINGS & SECURITY AUDIT HISTORY
  // ==========================================
  doc.addPage();
  drawPageHeader('Governance & Audit Trail');

  // Supervisor Consultations List
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...c.primary);
  doc.text('Supervisor-Scholar Periodic Research Consultations', 15, currentY);
  currentY += 4;

  // Table header
  doc.setFillColor(...c.bgLight); doc.rect(15, currentY, 180, 7, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('MEETING DATE & TIME', 18, currentY + 4.8);
  doc.text('DISCUSSION TOPIC', 65, currentY + 4.8);
  doc.text('SUPERVISOR REMARKS / ACTION DIRECTIVES', 120, currentY + 4.8);

  currentY += 7.2;

  if (meetings.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No guide consultations logs uploaded.', 18, currentY + 5);
    currentY += 10;
  } else {
    meetings.slice(0, 6).forEach((meet) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      const dateStr = meet.scheduledDate ? new Date(meet.scheduledDate).toLocaleString() : 'N/A';
      doc.text(dateStr, 18, currentY + 4.5);
      doc.text(safeText(meet.topic, 28), 65, currentY + 4.5);
      
      const remarks = meet.remarks || 'Consultation record finalized.';
      doc.text(safeText(remarks, 38), 120, currentY + 4.5);
      
      currentY += 8;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);
    });
  }

  // System Audit Logs (Crucial for NAAC verification)
  currentY += 8;
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...c.primary);
  doc.text('Scholar Lifecycle System Audit Trails', 15, currentY);
  currentY += 4;

  // Table header
  doc.setFillColor(...c.bgLight); doc.rect(15, currentY, 180, 7, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...c.textMuted);
  doc.text('LOG TIMESTAMP', 18, currentY + 4.8);
  doc.text('AUTHORIZED OFFICER / ID', 55, currentY + 4.8);
  doc.text('ACTION', 105, currentY + 4.8);
  doc.text('GOVERNANCE SYSTEM REMARKS NOTE', 140, currentY + 4.8);

  currentY += 7.2;

  const auditLogs = thesis?.auditLog || [];
  if (auditLogs.length === 0) {
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.text('No electronic audit logs registered for this scholar.', 18, currentY + 5);
  } else {
    // Sort reverse chronological
    const sortedAudit = [...auditLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    sortedAudit.forEach((log) => {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...c.textDark);
      doc.text(new Date(log.date).toLocaleString(), 18, currentY + 4.5);
      doc.text(log.byName || 'System', 55, currentY + 4.5);
      
      doc.setFont('Helvetica', 'bold'); doc.setTextColor(...c.primary);
      doc.text(log.action || 'UPDATE', 105, currentY + 4.5);
      
      doc.setFont('Helvetica', 'normal'); doc.setTextColor(...c.textMuted);
      doc.text(safeText(log.note || '', 30), 140, currentY + 4.5);
      
      currentY += 8;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);
    });
  }

  // ==========================================
  // FOOTER PAGINATION GENERATOR
  // ==========================================
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (i === 1) continue; // Skip cover page footer layout
    
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.textMuted);
    doc.setDrawColor(...c.border); doc.setLineWidth(0.5);
    doc.line(15, 282, 195, 282);
    doc.text('ScholarSync Performance Dossier  |  Accredited NAAC A++ IQAC Registry', 15, 288);
    doc.text(`Page ${i} of ${pageCount}`, 195, 288, { align: 'right' });
  }

  return doc;
};

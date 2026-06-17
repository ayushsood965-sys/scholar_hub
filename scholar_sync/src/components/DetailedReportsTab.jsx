import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { generatePremiumPDF } from '../utils/pdfReportGenerator';
import { FileText, Download, Loader } from 'lucide-react';
import { API_URL } from '../config';
import { ThesisContext } from '../context/ThesisContext';
import { useToast } from '../context/ToastContext';

const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const DetailedReportsTab = ({ user }) => {
  const toast = useToast();
  const { allTheses, fetchDeptTheses, fetchAssignedTheses, fetchAllTheses, fetchThesisById } = useContext(ThesisContext);
  
  const [session, setSession] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Determine subrole or HOD level
  const subRole = user?.role === 'HOD' ? 'HOD' : user?.subRole;

  // Filter department theses locally
  const deptTheses = allTheses.filter(t => t.department === user?.department);

  // Helper: check if a thesis/scholar belongs to an academic session (e.g. "2024-2025" means July 2024 - June 2025)
  const belongsToSession = (thesis, sessionStr) => {
    if (!sessionStr) return true;
    const [startYear, endYear] = sessionStr.split('-').map(Number);
    const sessionStart = new Date(startYear, 6, 1); // July 1 of start year
    const sessionEnd = new Date(endYear, 5, 30);     // June 30 of end year
    // Check admissionDate from scholar profile first, then thesis startDate, then thesis createdAt
    const dateStr = thesis.scholarId?.profile?.admissionDate || thesis.startDate || thesis.createdAt;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= sessionStart && d <= sessionEnd;
  };

  // Filter theses by selected session
  const sessionFilteredTheses = useMemo(() => {
    if (!session) return deptTheses;
    return deptTheses.filter(t => belongsToSession(t, session));
  }, [session, deptTheses]);

  // Reset candidate selection when session changes
  useEffect(() => {
    setSelectedCandidateId('');
  }, [session]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAllTheses();
    } else if (user?.role === 'HOD' || subRole === 'HOD') {
      fetchDeptTheses();
    } else {
      fetchAssignedTheses();
    }
  }, [user, subRole]);



  const loadLogoAsBase64 = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = '/hpu_logo.png';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  };

  const drawMilestoneDonut = (canvas, completed, total) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 25;
    const pct = total > 0 ? completed / total : 0;

    // Background track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc — green gradient
    if (pct > 0) {
      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (pct * 2 * Math.PI);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = '#1A5A3B';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Percentage text
    ctx.font = 'bold 28px Helvetica';
    ctx.fillStyle = '#133A26';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(pct * 100)}%`, centerX, centerY - 8);

    ctx.font = 'bold 10px Helvetica';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(`${completed}/${total} Milestones`, centerX, centerY + 14);

    ctx.font = '600 9px Helvetica';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('COMPLETION RATE', centerX, centerY + 28);
  };

  const drawPublicationsBarChart = (canvas, journals, conferences) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const paddingLeft = 40;
    const paddingBottom = 30;
    const paddingTop = 20;
    const paddingRight = 20;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const categories = ['Journals', 'Conferences'];
    const values = [journals, conferences];
    const maxVal = Math.max(4, ...values) + 1;

    // Grid
    ctx.font = '10px Helvetica';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const val = (maxVal / gridLines) * i;
      const y = height - paddingBottom - (chartHeight / gridLines) * i;
      ctx.fillText(Math.round(val).toString(), paddingLeft - 8, y);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Bars
    const barWidth = 40;
    const colors = ['#1A5A3B', '#2E9E5B'];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < categories.length; i++) {
      const val = values[i];
      const barHeight = (val / maxVal) * chartHeight;
      const x = paddingLeft + (chartWidth / categories.length) * i + (chartWidth / categories.length - barWidth) / 2;
      const y = height - paddingBottom - barHeight;

      ctx.fillStyle = colors[i];
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Helvetica';
      ctx.fillText(val.toString(), x + barWidth / 2, y - 14);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 10px Helvetica';
      ctx.fillText(categories[i], x + barWidth / 2, height - paddingBottom + 8);
    }

    // Base line
    ctx.beginPath();
    ctx.moveTo(paddingLeft, height - paddingBottom);
    ctx.lineTo(width - paddingRight, height - paddingBottom);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawHeader = (doc, logoBase64) => {
    // Green accent bar at very top
    doc.setFillColor(19, 58, 38);
    doc.rect(0, 0, 210, 3, 'F');

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 15, 8, 22, 22);
    }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(19, 58, 38);
    doc.text('Himachal Pradesh University', 105, 16, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text("(NAAC Accredited 'A' Grade University)", 105, 22, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Summerhill, Shimla — 171005, Himachal Pradesh', 105, 27, { align: 'center' });

    // Decorative double line
    doc.setDrawColor(19, 58, 38);
    doc.setLineWidth(0.8);
    doc.line(15, 33, 195, 33);
    doc.setDrawColor(165, 214, 167);
    doc.setLineWidth(0.4);
    doc.line(15, 35, 195, 35);

    return 42;
  };

  const checkNewPage = (doc, neededHeight, currentY, logoBase64) => {
    if (currentY + neededHeight > 275) {
      doc.addPage();
      return drawHeader(doc, logoBase64);
    }
    return currentY;
  };

  const addPageNumbers = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      // Footer line
      doc.setDrawColor(165, 214, 167);
      doc.setLineWidth(0.3);
      doc.line(15, 283, 195, 283);
      // Page number
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${i} of ${pageCount}`, 105, 288, { align: 'center' });
      // ScholarSync branding
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(19, 58, 38);
      doc.text('ScholarSync', 15, 288);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 288, { align: 'right' });
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!session) {
      return toast.warning('Please select an Academic Session.');
    }

    const sourceTheses = user?.role === 'ADMIN' ? allTheses.filter(t => belongsToSession(t, session)) : sessionFilteredTheses;

    if (sourceTheses.length === 0) {
      return toast.error('No scholar candidates found for the selected academic session.');
    }

    // Determine target theses
    let targets = [];
    if (selectedCandidateId) {
      const match = sourceTheses.find(t => t._id === selectedCandidateId);
      if (match) targets = [match];
    } else {
      targets = sourceTheses;
    }

    if (targets.length === 0) {
      return toast.error('No scholar records found matching the selection.');
    }

    setDownloading(true);
    setLoadingMsg('Initiating report compiler...');

    try {
      // 1. Fetch all relevant meetings based on user role once
      let allMeetings = [];
      try {
        const endpoint = user?.role === 'ADMIN' || user?.role === 'HOD' || subRole === 'HOD' ? 'dept' : 'faculty';
        const meetRes = await axios.get(`${API_URL}/meetings/${endpoint}`, getAuthHeader());
        allMeetings = meetRes.data || [];
      } catch (meetErr) {
        console.error('Failed to pre-fetch meetings:', meetErr);
      }

      // 2. Fetch all detailed data first
      const compiledData = [];
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        setLoadingMsg(`Compiling candidate data for ${t.scholarId?.name || 'Scholar'} (${i + 1}/${targets.length})...`);
        
        // Fetch detailed thesis + milestones
        const details = await fetchThesisById(t._id);
        
        // Fetch publications
        let publications = [];
        try {
          const pubRes = await axios.get(`${API_URL}/publications/thesis/${t._id}`, getAuthHeader());
          publications = pubRes.data || [];
        } catch (pubErr) {
          console.error(`Failed to fetch publications for thesis ${t._id}:`, pubErr);
        }

        // Fetch DRC meetings
        let drcMeetings = [];
        try {
          const drcRes = await axios.get(`${API_URL}/lifecycle/drc/thesis/${t._id}`, getAuthHeader());
          drcMeetings = drcRes.data || [];
        } catch (drcErr) {
          console.error(`Failed to fetch DRC meetings for thesis ${t._id}:`, drcErr);
        }

        // Fetch RAC reviews
        let racSessions = [];
        try {
          const racRes = await axios.get(`${API_URL}/lifecycle/rac/thesis/${t._id}`, getAuthHeader());
          racSessions = racRes.data || [];
        } catch (racErr) {
          console.error(`Failed to fetch RAC reviews for thesis ${t._id}:`, racErr);
        }

        // Fetch Additional Documents
        let additionalDocuments = [];
        try {
          const docRes = await axios.get(`${API_URL}/additional-documents/thesis/${t._id}`, getAuthHeader());
          additionalDocuments = docRes.data || [];
        } catch (docErr) {
          console.error(`Failed to fetch additional documents for thesis ${t._id}:`, docErr);
        }

        // Filter meetings locally
        const candidateMeetings = allMeetings.filter(m => 
          m.thesisId === t._id || 
          m.thesisId?._id === t._id || 
          m.scholarId === t.scholarId?._id || 
          m.scholarId?._id === t.scholarId?._id
        );

        compiledData.push({
          thesis: details.thesis,
          milestones: details.milestones || [],
          publications,
          drcMeetings,
          racSessions,
          additionalDocuments,
          meetings: candidateMeetings
        });
      }

      // 2. Load the HPU logo image
      setLoadingMsg('Loading official HPU crest logo...');
      const logoBase64 = await loadLogoAsBase64();

      // 3. Create PDF Dossier for each candidate
      setLoadingMsg('Assembling Premium Executive Dossier...');

      for (let i = 0; i < compiledData.length; i++) {
        const data = compiledData[i];
        
        // Pass session info down
        data.session = session;

        // Initialize doc
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        // Call external generator
        await generatePremiumPDF(doc, data, logoBase64);
        
        // Download
        const studentName = data.thesis?.scholarId?.name || 'Candidate';
        const fileName = `Dossier_${studentName.replace(/\s+/g, '_')}_${session}.pdf`;
        doc.save(fileName);
      }

      toast.success('Scholar Progress Record downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('PDF Error: ' + (err.message || String(err)));
    } finally {
      setDownloading(false);
      setLoadingMsg('');
    }
  };

  // Count stats for session
  const sessionStats = useMemo(() => {
    const filtered = sessionFilteredTheses;
    return {
      total: filtered.length,
      active: filtered.filter(t => t.status === 'ACTIVE_RESEARCH').length,
      coursework: filtered.filter(t => t.status === 'COURSEWORK').length,
      awarded: filtered.filter(t => t.status === 'AWARDED').length,
      submitted: filtered.filter(t => t.status === 'SUBMITTED' || t.status === 'PRE_SUBMISSION').length,
    };
  }, [sessionFilteredTheses]);

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes reportShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes reportPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes reportFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .spin-icon { animation: spin 1s linear infinite; }
        .report-card-animate { animation: reportFadeIn 0.5s ease-out both; }
        .report-stat-card {
          padding: 16px 20px; border-radius: 14px; text-align: center; flex: 1; min-width: 100px;
          border: 1px solid var(--color-border, #E5E7EB); position: relative; overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .report-stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
        .report-stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--color-primary, #1A5A3B), var(--color-success, #2E9E5B));
          border-radius: 14px 14px 0 0;
        }
        .report-select-enhanced {
          width: 100%; padding: 12px 16px; border-radius: 12px; font-size: 0.88rem; font-weight: 500;
          border: 1.5px solid var(--color-border, #E5E7EB); background: var(--color-surface, #FFFFFF);
          color: var(--color-text-primary, #1F2937); cursor: pointer;
          transition: all 0.25s ease; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236B7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
        }
        .report-select-enhanced:hover { border-color: var(--color-primary, #1A5A3B); }
        .report-select-enhanced:focus {
          outline: none; border-color: var(--color-primary, #1A5A3B);
          box-shadow: 0 0 0 3px rgba(26, 90, 59, 0.12);
        }
        .report-gen-btn {
          width: 100%; padding: 14px 28px; border-radius: 14px; font-size: 0.95rem; font-weight: 700;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(135deg, var(--color-sidebar, #133A26) 0%, var(--color-primary, #1A5A3B) 50%, var(--color-success, #2E9E5B) 100%);
          background-size: 200% 200%; color: #FFFFFF; letter-spacing: 0.3px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(19, 58, 38, 0.25);
        }
        .report-gen-btn:hover {
          background-position: 100% 100%; transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(19, 58, 38, 0.35);
        }
        .report-gen-btn:active { transform: translateY(0); }
        .report-loading-bar {
          height: 4px; border-radius: 4px; overflow: hidden;
          background: var(--color-border, #E5E7EB);
        }
        .report-loading-bar-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, var(--color-primary, #1A5A3B), var(--color-success, #2E9E5B), var(--color-primary, #1A5A3B));
          background-size: 200% 100%; animation: reportShimmer 1.5s ease infinite;
        }
      `}</style>

      {/* Header Card */}
      <div className="card report-card-animate" style={{
        padding: '28px 32px', borderRadius: 18, marginBottom: 20,
        background: `linear-gradient(135deg, var(--color-sidebar, #133A26) 0%, var(--color-primary, #1A5A3B) 100%)`,
        position: 'relative', overflow: 'hidden', border: 'none'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            padding: 14, borderRadius: 14, color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <FileText size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              Doctoral Progress Reports
            </h3>
            <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              Compile verified Ph.D. progress records, milestones, publications, and audit trails into print-ready PDF reports.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="card report-card-animate" style={{ padding: '28px 32px', borderRadius: 18, animationDelay: '0.1s' }}>
        <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Row 1: Session + Department */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary, #1A5A3B)' }} />
                Academic Session <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
              </label>
              <select
                className="report-select-enhanced"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                required
                disabled={downloading}
              >
                <option value="">— Select Session —</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
                <option value="2021-2022">2021-2022</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-border, #E5E7EB)' }} />
                Department
              </label>
              <select
                className="report-select-enhanced"
                value={user?.department || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              >
                <option value={user?.department || ''}>{user?.department || 'N/A'}</option>
              </select>
            </div>
          </div>

          {/* Session Stats Cards */}
          {session && (
            <div className="report-card-animate" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Scholars', val: sessionStats.total, color: 'var(--color-primary, #1A5A3B)', bg: 'rgba(26, 90, 59, 0.08)' },
                { label: 'Active Research', val: sessionStats.active, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
                { label: 'Coursework', val: sessionStats.coursework, color: '#D97706', bg: 'rgba(217, 119, 6, 0.08)' },
                { label: 'Submitted', val: sessionStats.submitted, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' },
                { label: 'Awarded', val: sessionStats.awarded, color: '#059669', bg: 'rgba(5, 150, 105, 0.08)' },
              ].map((s, i) => (
                <div key={i} className="report-stat-card" style={{ background: s.bg }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted, #6B7280)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Scholar Selector */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success, #2E9E5B)' }} />
                Scholar / Candidate
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-text-muted, #94A3B8)' }}>(Optional — leave blank for bulk report)</span>
              </span>
              {session && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: sessionFilteredTheses.length > 0 ? 'rgba(26, 90, 59, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: sessionFilteredTheses.length > 0 ? 'var(--color-primary, #1A5A3B)' : '#EF4444'
                }}>
                  {sessionFilteredTheses.length} candidate{sessionFilteredTheses.length !== 1 ? 's' : ''} found
                </span>
              )}
            </label>
            <select
              className="report-select-enhanced"
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              disabled={downloading || (!session)}
              style={!session ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <option value="">— All Session Candidates (Bulk Report) —</option>
              {sessionFilteredTheses.map(t => (
                <option key={t._id} value={t._id}>
                  {t.scholarId?.name} — {t.enrollmentNumber || 'No Enrollment'} — {(t.status || '').replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {!session && (
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted, #94A3B8)', fontStyle: 'italic' }}>
                Please select an academic session first to view eligible candidates.
              </p>
            )}
          </div>

          {/* Action Area */}
          <div style={{ borderTop: '1px solid var(--color-border, #E2E8F0)', paddingTop: 24, marginTop: 4 }}>
            {downloading ? (
              <div className="report-card-animate" style={{
                background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)',
                padding: '20px 24px', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(26, 90, 59, 0.1)'
                  }}>
                    <Loader className="spin-icon" size={18} color="var(--color-primary, #1A5A3B)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary, #1E293B)' }}>
                      Compiling Report...
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748B)' }}>
                      {loadingMsg}
                    </p>
                  </div>
                </div>
                <div className="report-loading-bar">
                  <div className="report-loading-bar-fill" style={{ width: '70%' }} />
                </div>
              </div>
            ) : (
              <button type="submit" className="report-gen-btn" disabled={!session}>
                <Download size={19} />
                Compile & Download PDF Report
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DetailedReportsTab;

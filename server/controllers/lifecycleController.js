const Thesis = require('../models/Thesis');
const User = require('../models/User');
const Publication = require('../models/Publication');
const ChangeRequest = require('../models/ChangeRequest');
const RACReview = require('../models/RACReview');
const DRCMeeting = require('../models/DRCMeeting');
const Milestone = require('../models/Milestone');
const { createNotification } = require('./notificationController');

// ── RAC MEETINGS ──
const scheduleRAC = async (req, res) => {
  try {
    const { thesisId, racNumber, scheduledDate, committeeMembers } = req.body;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    const existingRAC = await RACReview.findOne({ thesisId, racNumber, milestoneId: null });
    if (existingRAC) {
      return res.status(400).json({ message: `RAC-${racNumber} has already been scheduled or recorded for this candidate.` });
    }

    const newRAC = new RACReview({
      scholarId: thesis.scholarId,
      thesisId,
      racNumber,
      scheduledDate,
      committeeMembers,
      status: 'SCHEDULED'
    });

    await newRAC.save();

    // Log to thesis audit
    thesis.auditLog.push({
      action: 'RAC_SCHEDULED',
      note: `RAC-${racNumber} scheduled for ${new Date(scheduledDate).toDateString()}`
    });
    await thesis.save();

    res.status(201).json(newRAC);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadRACReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentRemarks } = req.body;
    const rac = await RACReview.findById(id);
    if (!rac) return res.status(404).json({ message: 'RAC meeting not found' });

    let fileUrl = '';
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.progressReportUrl) {
      fileUrl = req.body.progressReportUrl;
    }

    // Push new entry to submissions history array
    if (!rac.submissions) {
      rac.submissions = [];
    }
    rac.submissions.push({
      progressReportUrl: fileUrl || undefined,
      studentRemarks: studentRemarks || '',
      uploadedAt: new Date()
    });

    // Synchronize latest values to legacy single fields for backward compatibility
    if (fileUrl) {
      rac.progressReportUrl = fileUrl;
    }
    if (studentRemarks !== undefined) {
      rac.studentRemarks = studentRemarks;
    }
    
    await rac.save();
    res.json(rac);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const submitRACResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, researchProgress, nextMilestones, nextMeetingDate, committeeChairedBy } = req.body;
    const rac = await RACReview.findById(id);
    if (!rac) return res.status(404).json({ message: 'RAC meeting not found' });

    rac.status = status;
    rac.remarks = remarks || '';
    if (researchProgress !== undefined) rac.researchProgress = researchProgress;
    if (nextMilestones !== undefined) rac.nextMilestones = nextMilestones;
    if (nextMeetingDate !== undefined) rac.nextMeetingDate = nextMeetingDate;
    if (committeeChairedBy !== undefined) rac.committeeChairedBy = committeeChairedBy;
    
    await rac.save();

    // Log to thesis audit
    const thesis = await Thesis.findById(rac.thesisId);
    if (thesis) {
      thesis.auditLog.push({
        action: 'RAC_REVIEWED',
        note: `RAC-${rac.racNumber} marked ${status}. Remarks: ${remarks || ''}`
      });
      await thesis.save();
    }

    res.json(rac);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getRACs = async (req, res) => {
  try {
    const { thesisId } = req.params;
    const racs = await RACReview.find({ thesisId, milestoneId: null }).sort('racNumber');
    res.json(racs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── CHANGE REQUESTS ──
const submitChangeRequest = async (req, res) => {
  try {
    const { thesisId, type, proposedValue, reason } = req.body;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    let currentValue = '';
    if (type === 'TITLE_CHANGE') {
      currentValue = thesis.title;
    } else if (type === 'GUIDE_CHANGE') {
      const supervisor = await User.findById(thesis.supervisorId);
      currentValue = supervisor ? supervisor.name : 'None';
    }

    const newRequest = new ChangeRequest({
      scholarId: thesis.scholarId,
      thesisId,
      type,
      currentValue,
      proposedValue,
      reason,
      status: 'PENDING'
    });

    await newRequest.save();

    thesis.auditLog.push({
      action: 'CHANGE_REQUESTED',
      note: `Requested ${type.replace('_', ' ')}: ${proposedValue}`
    });
    await thesis.save();

    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reviewChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, proposedValue } = req.body; // 'APPROVED' or 'REJECTED', proposedValue optional override
    const request = await ChangeRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Change request not found' });

    if (proposedValue) {
      request.proposedValue = proposedValue;
    }
    request.status = status;
    request.remarks = remarks;
    await request.save();

    const thesis = await Thesis.findById(request.thesisId);
    if (thesis) {
      if (status === 'APPROVED') {
        if (request.type === 'TITLE_CHANGE') {
          thesis.title = request.proposedValue;
        } else if (request.type === 'GUIDE_CHANGE') {
          thesis.supervisorId = request.proposedValue;
        }
      }
      thesis.auditLog.push({
        action: 'CHANGE_RESOLVED',
        note: `Change request for ${request.type.replace('_', ' ')} was ${status}. Remarks: ${remarks}`
      });
      await thesis.save();
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getChangeRequests = async (req, res) => {
  try {
    const { thesisId } = req.params;
    const requests = await ChangeRequest.find({ thesisId }).sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDeptChangeRequests = async (req, res) => {
  try {
    const { department } = req.params;
    // Find all theses in dept
    const theses = await Thesis.find({ department });
    const thesisIds = theses.map(t => t._id);
    const requests = await ChangeRequest.find({ thesisId: { $in: thesisIds } }).populate('scholarId').sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUBLICATIONS ──
const submitPublication = async (req, res) => {
  try {
    const { thesisId, title, journalName, issn, publicationDate, paperLink, attachmentUrl } = req.body;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    const newPub = new Publication({
      scholarId: thesis.scholarId,
      thesisId,
      title,
      journalName,
      issn,
      publicationDate,
      paperLink,
      attachmentUrl
    });

    await newPub.save();

    thesis.auditLog.push({
      action: 'PUBLICATION_SUBMITTED',
      note: `Logged publication: "${title}" in ${journalName}`
    });
    await thesis.save();

    res.status(201).json(newPub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'VERIFIED' or 'REJECTED'
    const pub = await Publication.findById(id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });

    pub.status = status;
    await pub.save();

    const thesis = await Thesis.findById(pub.thesisId);
    if (thesis) {
      thesis.auditLog.push({
        action: 'PUBLICATION_VERIFIED',
        note: `Publication "${pub.title}" marked ${status}`
      });
      await thesis.save();
    }

    res.json(pub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPublications = async (req, res) => {
  try {
    const { thesisId } = req.params;
    const pubs = await Publication.find({ thesisId }).sort('-publicationDate');
    res.json(pubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDeptPublications = async (req, res) => {
  try {
    const { department } = req.params;
    const theses = await Thesis.find({ department });
    const thesisIds = theses.map(t => t._id);
    const pubs = await Publication.find({ thesisId: { $in: thesisIds } }).populate('scholarId').sort('-createdAt');
    res.json(pubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PREMIUM PRINTABLE DYNAMIC CERTIFICATES ──
const generateCertificate = async (req, res) => {
  try {
    const { thesisId, type } = req.params;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).send('Thesis record not found');

    const scholar = await User.findById(thesis.scholarId);
    const supervisor = await User.findById(thesis.supervisorId);

    const fs = require('fs');
    const path = require('path');
    let logoBase64 = '';
    let logoPath = path.join(__dirname, '..', 'uploads', 'hpu_logo.png');
    if (!fs.existsSync(logoPath)) {
      logoPath = path.join(__dirname, '..', '..', 'client', 'public', 'hpu_logo.png');
    }
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }

    let titleText = '';
    let bodyText = '';
    let extraTable = '';

    if (type === 'REGISTRATION') {
      titleText = 'Certificate of PhD Registration';
      bodyText = `This is to certify that Mr./Ms. <strong>${scholar?.name || 'Academic Scholar'}</strong> has been officially registered as a Doctor of Philosophy (Ph.D.) candidate in the department of <strong>${thesis.department}</strong> on this date <strong>${new Date(thesis.createdAt).toLocaleDateString()}</strong> under the enrollment ID <strong>${thesis.enrollmentNumber || thesis.enrollmentNo || 'PENDING'}</strong>.<br/><br/>The registered thesis research topic has been approved as: <i>"${thesis.title}"</i>.`;
    } else if (type === 'COURSEWORK') {
      titleText = 'Certificate of Course Work Completion';
      bodyText = `This is to certify that <strong>${scholar?.name || 'Academic Scholar'}</strong> has successfully satisfied all academic course work requirements of the Doctor of Philosophy degree program in <strong>${thesis.department}</strong> as verified on <strong>${new Date().toLocaleDateString()}</strong>. The candidate completed all core and elective subjects under the assigned supervisor <strong>Prof. ${supervisor?.name || 'Academic Guide'}</strong>.`;
    } else if (type === 'PUBLICATIONS') {
      titleText = 'Certificate of Research Publications';
      const pubs = await Publication.find({ thesisId, status: 'VERIFIED' });
      bodyText = `This document certifies that <strong>${scholar?.name || 'Academic Scholar'}</strong> has actively contributed to the scientific community and successfully logged the following verified peer-reviewed publications as part of their PhD journey:`;
      if (pubs.length > 0) {
        extraTable = `
          <table style="width:100%; border-collapse: collapse; margin-top:20px; font-family:'Outfit',sans-serif; font-size:0.9rem;">
            <thead>
              <tr style="background:#f1f5f9; color:#0f172a; text-align:left;">
                <th style="padding:10px; border:1px solid #cbd5e1;">Paper Title</th>
                <th style="padding:10px; border:1px solid #cbd5e1;">Journal Name</th>
                <th style="padding:10px; border:1px solid #cbd5e1;">ISSN</th>
                <th style="padding:10px; border:1px solid #cbd5e1;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${pubs.map(p => `
                <tr>
                  <td style="padding:10px; border:1px solid #cbd5e1; font-weight:600;">${p.title}</td>
                  <td style="padding:10px; border:1px solid #cbd5e1;">${p.journalName}</td>
                  <td style="padding:10px; border:1px solid #cbd5e1;">${p.issn || '—'}</td>
                  <td style="padding:10px; border:1px solid #cbd5e1;">${new Date(p.publicationDate).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        extraTable = `<div style="text-align:center; padding:20px; color:#64748b; font-style:italic;">No verified publications logged yet.</div>`;
      }
    } else if (type === 'RAC') {
      titleText = 'Research Progress & RAC Verification';
      const racs = await RACReview.find({ thesisId, status: 'SATISFACTORY', milestoneId: null });
      bodyText = `This is to certify that the Research Advisory Committee (RAC) has reviewed the ongoing doctoral work of <strong>${scholar?.name || 'Academic Scholar'}</strong>. The candidate has presented satisfactory progress reports across the required assessment sessions.`;
      if (racs.length > 0) {
        extraTable = `
          <div style="margin-top:20px; font-weight:600; color:#0f172a; text-align:center;">
            Verified RAC Clearances: 
            ${racs.map(r => `<span style="display:inline-block; background:#d1fae5; color:#065f46; padding:4px 12px; margin:4px; border-radius:12px; font-size:0.8rem;">RAC-${r.racNumber} Satisfactory</span>`).join('')}
          </div>
        `;
      }
    } else {
      return res.status(400).send('Invalid certificate type');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${titleText}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Outfit:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
          <style>
            body {
              background: #f1f5f9;
              margin: 0;
              padding: 45px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: 'Outfit', sans-serif;
              min-height: 100vh;
            }
            .certificate-container {
              background: white;
              border: 12px double #15803d;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
              width: 850px;
              padding: 50px 65px;
              position: relative;
              border-radius: 4px;
              box-sizing: border-box;
              overflow: hidden;
            }
            .certificate-header {
              text-align: center;
              margin-bottom: 25px;
              z-index: 5;
              position: relative;
            }
            .university-title {
              font-family: 'Cinzel', serif;
              font-size: 2.1rem;
              font-weight: 800;
              color: #15803d;
              margin: 8px 0 2px 0;
              letter-spacing: 1px;
            }
            .university-subtitle {
              color: #b45309;
              font-size: 0.82rem;
              text-transform: uppercase;
              letter-spacing: 4px;
              font-weight: 800;
              margin: 0;
            }
            .university-location {
              font-size: 0.8rem;
              color: #475569;
              font-weight: 600;
              margin: 4px 0 0 0;
              letter-spacing: 1px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              opacity: 0.05;
              pointer-events: none;
              width: 440px;
              height: 440px;
              z-index: 0;
            }
            .certificate-divider {
              height: 2px;
              background: linear-gradient(to right, transparent, #d97706, transparent);
              margin: 15px auto;
              width: 80%;
            }
            .certificate-title {
              font-family: 'Cinzel', serif;
              color: #1e3a8a;
              font-size: 1.5rem;
              text-align: center;
              font-weight: 800;
              margin-top: 10px;
              margin-bottom: 24px;
              text-transform: uppercase;
              letter-spacing: 1px;
              z-index: 5;
              position: relative;
            }
            .certificate-body {
              color: #334155;
              font-size: 1.05rem;
              line-height: 1.85;
              text-align: center;
              margin-bottom: 35px;
              padding: 0 15px;
              z-index: 5;
              position: relative;
            }
            .certificate-footer {
              display: flex;
              justify-content: space-between;
              margin-top: 55px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 22px;
              z-index: 5;
              position: relative;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              height: 1.2px;
              background: #64748b;
              margin-bottom: 8px;
            }
            .signature-handwritten {
              font-family: 'Great Vibes', cursive;
              font-size: 1.7rem;
              color: #0f172a;
              margin-bottom: 4px;
              opacity: 0.85;
              height: 38px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .signature-title {
              font-size: 0.78rem;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .gold-seal-wrapper {
              position: absolute;
              bottom: 45px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 10;
            }
            @media print {
              body { background: white; padding: 0; }
              .certificate-container { border: 12px double #15803d; box-shadow: none; width: 100%; box-sizing: border-box; }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <!-- Giant high-fidelity background watermark seal of HPU -->
            <img class="watermark" src="${logoBase64}" alt="HPU Watermark Seal" />

            <div class="certificate-header">
              <!-- Official HPU Logo Emblem -->
              <img src="${logoBase64}" alt="HPU Logo" style="width: 105px; height: 105px; object-fit: contain; margin: 0 auto 12px; display: block;" />

              <h1 class="university-title">Himachal Pradesh University</h1>
              <p class="university-subtitle">Dean of Doctoral Studies & Research Office</p>
              <p class="university-location">Summer Hill, Shimla, H.P., India</p>
              <div class="certificate-divider"></div>
            </div>
            
            <h2 class="certificate-title">${titleText}</h2>
            
            <div class="certificate-body">
              ${bodyText}
              ${extraTable}
            </div>
            
            <div class="certificate-footer">
              <div class="signature-box">
                <div class="signature-handwritten">${supervisor ? 'Prof. ' + supervisor.name.split(' ')[0] : 'Academic Guide'}</div>
                <div class="signature-line"></div>
                <div class="signature-title">Research Supervisor</div>
              </div>
              <div class="signature-box" style="visibility:${thesis.enrollmentVerified ? 'visible' : 'hidden'}">
                <div class="signature-handwritten" style="font-family:'Cinzel',serif; color:#15803d; font-size:0.9rem; font-weight:800; letter-spacing:1px; transform: rotate(-5deg); border: 2px solid #15803d; padding: 4px 10px; border-radius: 6px; width: fit-content; margin: 0 auto 5px;">HPU VERIFIED</div>
                <div class="signature-line"></div>
                <div class="signature-title">Head of Department</div>
              </div>
            </div>

            <!-- Highly authentic shining gold rosette authentication seal -->
            <div class="gold-seal-wrapper">
              <svg width="60" height="60" viewBox="0 0 64 64" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))">
                <path d="M32 0 L36 8 L44 4 L44 14 L53 11 L50 20 L59 20 L53 28 L60 32 L53 36 L59 44 L50 44 L53 53 L44 50 L44 60 L36 56 L32 64 L28 56 L20 60 L20 50 L11 53 L14 44 L5 44 L11 36 L4 32 L11 28 L5 20 L14 20 L11 11 L20 14 L20 4 L28 8 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.2" />
                <circle cx="32" cy="32" r="22" fill="#d97706" />
                <circle cx="32" cy="32" r="20" fill="url(#goldRosetteSeal)" />
                <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 2" />
                <text x="32" y="31" font-family="'Cinzel', serif" font-size="5px" fill="#78350f" font-weight="bold" text-anchor="middle" letter-spacing="0.5">OFFICIAL</text>
                <text x="32" y="38" font-family="'Cinzel', serif" font-size="5px" fill="#78350f" font-weight="bold" text-anchor="middle" letter-spacing="0.5">HPU SEAL</text>
                <text x="32" y="44" font-family="'Outfit', sans-serif" font-size="4.5px" fill="#15803d" font-weight="bold" text-anchor="middle" letter-spacing="0.5">ESTD 1970</text>
              </svg>
            </div>
          </div>
          <script>
            window.onload = function() {
              // Auto trigger print dialogue for user convenience
              // window.print();
            }
          </script>
        </body>
      </html>
    `;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(htmlContent);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// ── DRC MEETINGS ──
const scheduleDRC = async (req, res) => {
  try {
    const { thesisId, scheduledDate, scheduledTime, venue, committeeMembers, agenda } = req.body;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    const isSynopsisApproval = thesis.status === 'SYNOPSIS_PENDING';
    const dynamicTitle = isSynopsisApproval ? 'DRC for Synopsis Approval' : 'DRC Meeting';

    const newDRC = new DRCMeeting({
      scholarId: thesis.scholarId,
      thesisId,
      scheduledDate,
      scheduledTime,
      venue,
      committeeMembers,
      agenda: isSynopsisApproval ? (agenda || 'DRC for Synopsis Approval') : agenda,
      title: dynamicTitle,
      isSynopsisApproval,
      status: 'SCHEDULED'
    });

    await newDRC.save();

    // Log to thesis audit
    thesis.auditLog.push({
      action: 'DRC_SCHEDULED',
      note: `${dynamicTitle} scheduled for ${new Date(scheduledDate).toDateString()} at ${scheduledTime} in ${venue}`
    });
    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: `📆 ${dynamicTitle} Scheduled!`,
      message: isSynopsisApproval
        ? `HOD has scheduled your Departmental Research Committee (DRC) synopsis evaluation meeting on ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}.`
        : `HOD has scheduled a ${dynamicTitle} on ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}. Agenda: ${agenda || 'None'}.`,
      type: 'INFO',
      link: 'overview'
    });

    res.status(201).json(newDRC);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitDRCResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // 'APPROVED' or 'REVISION_REQUIRED'
    const drc = await DRCMeeting.findById(id);
    if (!drc) return res.status(404).json({ message: 'DRC meeting not found' });

    drc.status = status;
    drc.remarks = remarks;
    await drc.save();

    // Log to thesis audit and perform status transitions
    const thesis = await Thesis.findById(drc.thesisId);
    if (thesis) {
      if (status === 'APPROVED') {
        if (drc.isSynopsisApproval) {
          thesis.status = 'ACTIVE_RESEARCH';
          thesis.startDate = new Date();

          // Update synopsis milestone to APPROVED
          const synopsis = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
          if (synopsis) {
            synopsis.status = 'APPROVED';
            await synopsis.save();
          }

          // Auto-create first 6-month progress report milestone
          const existingReport = await Milestone.findOne({ thesisId: thesis._id, type: '6_MONTH_REPORT' });
          if (!existingReport) {
            await Milestone.create({
              thesisId: thesis._id,
              type: '6_MONTH_REPORT',
              title: '6-Month Progress Report #1',
              status: 'PENDING',
              sequence: 1,
              dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            });
          }
        }

        thesis.auditLog.push({
          action: 'DRC_APPROVED',
          note: `${drc.title || 'DRC'} approved. Remarks: ${remarks}`
        });
        await thesis.save();
      } else {
        if (drc.isSynopsisApproval) {
          // Update synopsis milestone back to REVISION_REQUIRED
          const synopsis = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
          if (synopsis) {
            synopsis.status = 'REVISION_REQUIRED';
            await synopsis.save();
          }
        }

        thesis.auditLog.push({
          action: 'DRC_REVISION_REQUIRED',
          note: `${drc.title || 'DRC'} marked Revision Required. Remarks: ${remarks}`
        });
        await thesis.save();
      }
    }

    if (status === 'APPROVED') {
      await createNotification({
        recipient: drc.scholarId,
        title: `🎉 ${drc.title || 'DRC'} Approved!`,
        message: drc.isSynopsisApproval 
          ? `Congratulations! The DRC panel has officially APPROVED your research synopsis. You are now in the ACTIVE_RESEARCH phase.`
          : `Your DRC meeting has been APPROVED. Remarks: "${remarks}".`,
        type: 'SUCCESSFUL_ACTION',
        link: 'overview'
      });
    } else {
      await createNotification({
        recipient: drc.scholarId,
        title: `⚠️ ${drc.title || 'DRC'} Revision Required`,
        message: drc.isSynopsisApproval
          ? `The DRC panel has requested revisions for your synopsis. Remarks: "${remarks}". Please revise and re-upload your document.`
          : `The DRC panel has requested revisions/actions. Remarks: "${remarks}".`,
        type: 'PENDING_ACTION',
        link: drc.isSynopsisApproval ? 'thesis' : 'overview'
      });
    }

    res.json(drc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDRCMeetings = async (req, res) => {
  try {
    const { thesisId } = req.params;
    const drcMeetings = await DRCMeeting.find({ thesisId }).sort('-createdAt');
    res.json(drcMeetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const recordOfflineDRC = async (req, res) => {
  try {
    const { thesisId, conductedDate, venue, committeeMembers, remarks, status } = req.body; // status is 'APPROVED' or 'REVISION_REQUIRED'
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    const isSynopsisApproval = thesis.status === 'SYNOPSIS_PENDING';
    const dynamicTitle = isSynopsisApproval ? 'DRC for Synopsis Approval' : 'DRC Meeting';

    const newDRC = new DRCMeeting({
      scholarId: thesis.scholarId,
      thesisId,
      scheduledDate: conductedDate || new Date(),
      scheduledTime: 'Offline Conducted',
      venue: venue || 'Offline Department Room',
      committeeMembers: committeeMembers || 'Department Board',
      agenda: 'Offline Evaluation Conducted',
      title: dynamicTitle,
      isSynopsisApproval,
      status: status,
      remarks: remarks
    });

    await newDRC.save();

    if (status === 'APPROVED') {
      if (isSynopsisApproval) {
        thesis.status = 'ACTIVE_RESEARCH';
        thesis.startDate = new Date();

        // Update synopsis milestone to APPROVED
        const synopsis = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
        if (synopsis) {
          synopsis.status = 'APPROVED';
          await synopsis.save();
        }

        // Auto-create first 6-month progress report milestone
        const existingReport = await Milestone.findOne({ thesisId: thesis._id, type: '6_MONTH_REPORT' });
        if (!existingReport) {
          await Milestone.create({
            thesisId: thesis._id,
            type: '6_MONTH_REPORT',
            title: '6-Month Progress Report #1',
            status: 'PENDING',
            sequence: 1,
            dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          });
        }
      }

      thesis.auditLog.push({
        action: 'DRC_APPROVED',
        note: `${dynamicTitle} approved offline. Remarks: ${remarks}`
      });
      await thesis.save();

      await createNotification({
        recipient: newDRC.scholarId,
        title: `🎉 ${dynamicTitle} Approved!`,
        message: isSynopsisApproval
          ? `Congratulations! The DRC panel has officially APPROVED your research synopsis offline. You are now in the ACTIVE_RESEARCH phase.`
          : `Your DRC meeting has been APPROVED offline. Remarks: "${remarks}".`,
        type: 'SUCCESSFUL_ACTION',
        link: 'overview'
      });
    } else {
      if (isSynopsisApproval) {
        const synopsis = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
        if (synopsis) {
          synopsis.status = 'REVISION_REQUIRED';
          await synopsis.save();
        }
      }

      thesis.auditLog.push({
        action: 'DRC_REVISION_REQUIRED',
        note: `${dynamicTitle} marked Revision Required offline. Remarks: ${remarks}`
      });
      await thesis.save();

      await createNotification({
        recipient: newDRC.scholarId,
        title: `⚠️ ${dynamicTitle} Revision Required`,
        message: isSynopsisApproval
          ? `The DRC panel has requested revisions for your synopsis offline. Remarks: "${remarks}". Please revise and re-upload your document.`
          : `The DRC panel has requested revisions/actions offline. Remarks: "${remarks}".`,
        type: 'PENDING_ACTION',
        link: isSynopsisApproval ? 'thesis' : 'overview'
      });
    }

    res.status(201).json(newDRC);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rescheduleDRC = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, venue, committeeMembers, remarks } = req.body;
    const drc = await DRCMeeting.findById(id);
    if (!drc) return res.status(404).json({ message: 'DRC meeting not found' });

    drc.scheduledDate = scheduledDate;
    drc.scheduledTime = scheduledTime;
    drc.venue = venue;
    if (committeeMembers !== undefined) drc.committeeMembers = committeeMembers;
    if (remarks !== undefined) drc.remarks = remarks;
    drc.status = 'SCHEDULED';
    await drc.save();

    const thesis = await Thesis.findById(drc.thesisId);
    if (thesis) {
      thesis.auditLog.push({
        action: 'DRC_RESCHEDULED',
        note: `DRC rescheduled for ${new Date(scheduledDate).toDateString()} at ${scheduledTime} in ${venue}. Reason/Remarks: ${remarks || 'None'}`
      });
      await thesis.save();

      await createNotification({
        recipient: drc.scholarId,
        title: '📆 DRC Meeting Rescheduled!',
        message: `HOD has rescheduled your Departmental Research Committee (DRC) synopsis evaluation meeting to ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}.`,
        type: 'INFO',
        link: 'overview'
      });
    }

    res.json(drc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  scheduleRAC,
  uploadRACReport,
  submitRACResult,
  getRACs,
  submitChangeRequest,
  reviewChangeRequest,
  getChangeRequests,
  getDeptChangeRequests,
  submitPublication,
  verifyPublication,
  getPublications,
  getDeptPublications,
  generateCertificate,
  scheduleDRC,
  submitDRCResult,
  getDRCMeetings,
  recordOfflineDRC,
  rescheduleDRC
};

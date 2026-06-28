const Publication = require('../models/Publication');
const Thesis = require('../models/Thesis');
const paginate = require('../utils/paginate');

// POST /api/publications — Submit a publication log with PDF proof file
const submitPublication = async (req, res) => {
  try {
    const { thesisId, title, journalName, issn, publicationDate, paperLink, type, doiUrl, iprType, itemStatus, indexing, volume, issue, pages } = req.body;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    let documentUrl = '';
    if (req.file) {
      documentUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.documentUrl) {
      documentUrl = req.body.documentUrl;
    }

    const newPub = new Publication({
      scholarId: thesis.scholarId,
      thesisId,
      title,
      journalName,
      issn,
      publicationDate: publicationDate || new Date(),
      paperLink: paperLink || doiUrl || '',
      doiUrl: doiUrl || '',
      attachmentUrl: documentUrl, // legacy compatibility
      documentUrl, // new Phase 5 field
      type: type || 'JOURNAL',
      iprType: iprType || '',
      itemStatus: itemStatus || '',
      indexing: indexing || '',
      volume: volume || '',
      issue: issue || '',
      pages: pages || '',
      status: 'DRAFT'
    });

    await newPub.save();

    // Log to thesis audit
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

// GET /api/publications/thesis/:thesisId — Get all publications for a thesis
const getPublicationsByThesis = async (req, res) => {
  try {
    const { thesisId } = req.params;
    let mongoQuery = Publication.find({ thesisId }).sort('-publicationDate');
    const pubs = await paginate(mongoQuery, req.query);
    res.json(pubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/publications/department/:department — Get all department publications
const getDeptPublications = async (req, res) => {
  try {
    const { department } = req.params;
    const theses = await Thesis.find({ department });
    const thesisIds = theses.map(t => t._id);
    let mongoQuery = Publication.find({ thesisId: { $in: thesisIds } })
      .populate('scholarId')
      .sort('-createdAt');
    const pubs = await paginate(mongoQuery, req.query);
    res.json(pubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/publications/:id/verify — Verify or reject publication
const verifyPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // 'VERIFIED' or 'REJECTED', and optional remarks
    const pub = await Publication.findById(id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });

    const thesis = await Thesis.findById(pub.thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // Role checks
    const isSupervisor = thesis.supervisorId && thesis.supervisorId.toString() === req.user._id.toString();
    const isHodUser = req.user.role === 'HOD' || req.user.subRole === 'HOD' || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (pub.status === 'PENDING') {
      if (!isSupervisor && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only the supervisor can review this publication at this stage.' });
      }
    } else if (pub.status === 'UNDER_REVIEW_HOD') {
      if (!isHodUser) {
        return res.status(403).json({ message: 'Only the HOD can review this publication at this stage.' });
      }
    } else {
      return res.status(400).json({ message: `Publication is currently ${pub.status} and cannot be evaluated.` });
    }

    let targetStatus = status;

    if (pub.status === 'PENDING') {
      // Step 1: Supervisor-level review
      if (status === 'VERIFIED') {
        targetStatus = 'UNDER_REVIEW_HOD';
        pub.remarks = '';
      } else if (status === 'REJECTED') {
        targetStatus = 'REJECTED_BY_SUPERVISOR';
        if (remarks !== undefined) pub.remarks = remarks;
      }
    } else if (pub.status === 'UNDER_REVIEW_HOD') {
      // Step 2: HOD-level final review
      if (status === 'VERIFIED') {
        targetStatus = 'VERIFIED';
        pub.remarks = '';
      } else if (status === 'REJECTED') {
        targetStatus = 'REJECTED_BY_HOD';
        if (remarks !== undefined) pub.remarks = remarks;
      }
    }

    pub.status = targetStatus;
    await pub.save();

    if (thesis) {
      thesis.auditLog.push({
        action: targetStatus === 'VERIFIED' ? 'PUBLICATION_VERIFIED' : targetStatus === 'UNDER_REVIEW_HOD' ? 'PUBLICATION_FORWARDED' : 'PUBLICATION_REJECTED',
        note: `Publication "${pub.title}" marked ${targetStatus}.${remarks ? ' Remarks: ' + remarks : ''}`
      });
      await thesis.save();
    }

    res.json(pub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/publications/:id — Update/Edit publication entry
const updatePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, journalName, issn, publicationDate, paperLink, type, doiUrl, iprType, itemStatus, indexing, volume, issue, pages } = req.body;
    const pub = await Publication.findById(id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });

    let documentUrl = pub.documentUrl;
    if (req.file) {
      // If a new file is uploaded, remove the old file from disk
      const fs = require('fs');
      const path = require('path');
      if (pub.documentUrl && pub.documentUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', pub.documentUrl);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.error('Failed to delete old file:', e);
          }
        }
      }
      documentUrl = `/uploads/${req.file.filename}`;
    }

    pub.title = title || pub.title;
    pub.journalName = journalName || pub.journalName;
    pub.issn = issn !== undefined ? issn : pub.issn;
    if (publicationDate) pub.publicationDate = publicationDate;
    pub.paperLink = paperLink || doiUrl || pub.paperLink || '';
    pub.doiUrl = doiUrl !== undefined ? doiUrl : pub.doiUrl;
    pub.type = type || pub.type;
    if (type === 'IPR') pub.iprType = iprType;
    pub.itemStatus = itemStatus || pub.itemStatus;
    pub.indexing = indexing !== undefined ? indexing : pub.indexing;
    pub.volume = volume !== undefined ? volume : pub.volume;
    pub.issue = issue !== undefined ? issue : pub.issue;
    pub.pages = pages !== undefined ? pages : pub.pages;
    pub.documentUrl = documentUrl;
    pub.attachmentUrl = documentUrl; // legacy compatibility

    // If status was REJECTED, move it back to DRAFT for resubmission
    if (
      pub.status === 'REJECTED_BY_SUPERVISOR' || 
      pub.status === 'REJECTED_BY_HOD' || 
      pub.status === 'REJECTED' || 
      pub.status === 'DRAFT'
    ) {
      pub.status = 'DRAFT';
      pub.remarks = ''; // Clear previous rejection remarks
    }

    await pub.save();

    // Log to thesis audit
    const thesis = await Thesis.findById(pub.thesisId);
    if (thesis) {
      thesis.auditLog.push({
        action: 'PUBLICATION_UPDATED',
        note: `Updated research output: "${pub.title}"`
      });
      await thesis.save();
    }

    res.json(pub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/publications/:id — Delete publication entry
const deletePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const pub = await Publication.findById(id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });

    // Clean up uploaded file
    const fs = require('fs');
    const path = require('path');
    if (pub.documentUrl && pub.documentUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', pub.documentUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to delete file:', e);
        }
      }
    }

    await Publication.deleteOne({ _id: id });

    // Log to thesis audit
    const thesis = await Thesis.findById(pub.thesisId);
    if (thesis) {
      thesis.auditLog.push({
        action: 'PUBLICATION_DELETED',
        note: `Deleted research output: "${pub.title}"`
      });
      await thesis.save();
    }

    res.json({ message: 'Publication deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/publications/thesis/:thesisId/submit-drafts — Submit all DRAFT publications to supervisor
const submitDrafts = async (req, res) => {
  try {
    const { thesisId } = req.params;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // Update all drafts to PENDING
    const result = await Publication.updateMany(
      { thesisId, status: 'DRAFT' },
      { $set: { status: 'PENDING' } }
    );

    if (result.matchedCount > 0) {
      thesis.auditLog.push({
        action: 'RESEARCH_OUTPUTS_SUBMITTED',
        note: `Submitted ${result.modifiedCount} draft research outputs for approval`
      });
      await thesis.save();
    }

    res.json({ message: `Successfully submitted ${result.modifiedCount} draft research outputs.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitPublication,
  getPublicationsByThesis,
  getDeptPublications,
  verifyPublication,
  updatePublication,
  deletePublication,
  submitDrafts
};

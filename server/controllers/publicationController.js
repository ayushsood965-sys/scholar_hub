const Publication = require('../models/Publication');
const Thesis = require('../models/Thesis');

// POST /api/publications — Submit a publication log with PDF proof file
const submitPublication = async (req, res) => {
  try {
    const { thesisId, title, journalName, issn, publicationDate, paperLink, type, doiUrl, iprType, itemStatus } = req.body;
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
      status: 'PENDING'
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
    const pubs = await Publication.find({ thesisId }).sort('-publicationDate');
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
    const pubs = await Publication.find({ thesisId: { $in: thesisIds } })
      .populate('scholarId')
      .sort('-createdAt');
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

    pub.status = status;
    if (remarks !== undefined) {
      pub.remarks = remarks;
    }
    await pub.save();

    const thesis = await Thesis.findById(pub.thesisId);
    if (thesis) {
      thesis.auditLog.push({
        action: status === 'VERIFIED' ? 'PUBLICATION_VERIFIED' : 'PUBLICATION_REJECTED',
        note: `Publication "${pub.title}" marked ${status}.${remarks ? ' Remarks: ' + remarks : ''}`
      });
      await thesis.save();
    }

    res.json(pub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitPublication,
  getPublicationsByThesis,
  getDeptPublications,
  verifyPublication
};

const AdditionalDocument = require('../models/AdditionalDocument');
const Thesis = require('../models/Thesis');
const { createNotification } = require('./notificationController');

// POST /api/additional-documents — Student uploads document
const uploadDocument = async (req, res) => {
  try {
    const { title, description, forwardedTo, forwardedRole } = req.body;
    if (!title || !forwardedTo || !forwardedRole) {
      return res.status(400).json({ message: 'Document title, forwarded recipient, and role are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload the document file (PDF format only).' });
    }

    const thesis = await Thesis.findOne({ scholarId: req.user._id });
    if (!thesis) return res.status(404).json({ message: 'Thesis context not found for this scholar.' });

    const newDoc = await AdditionalDocument.create({
      scholarId: req.user._id,
      thesisId: thesis._id,
      title,
      description: description || '',
      documentUrl: `/uploads/${req.file.filename}`,
      forwardedTo,
      forwardedRole,
      department: thesis.department,
      status: 'SUBMITTED'
    });

    // Notify forwardee recipient
    await createNotification({
      recipient: forwardedTo,
      title: '⏳ New Scholar Document Uploaded',
      message: `Scholar "${req.user.name}" has uploaded and forwarded an additional document "${title}" to you for review.`,
      type: 'PENDING_ACTION',
      link: 'documents'
    });

    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/additional-documents/me — Student views their own documents
const getMyDocuments = async (req, res) => {
  try {
    const docs = await AdditionalDocument.find({ scholarId: req.user._id })
      .populate('forwardedTo', 'name email role subRole')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/additional-documents/forwarded — Faculty or HOD retrieves documents forwarded to them
const getForwardedDocuments = async (req, res) => {
  try {
    const docs = await AdditionalDocument.find({ forwardedTo: req.user._id })
      .populate('scholarId', 'name email username profile')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/additional-documents/:id/review — Review document
const reviewDocument = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ message: 'Evaluation remarks are required.' });
    }

    const doc = await AdditionalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document upload not found.' });

    // Recipient check
    if (doc.forwardedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized. This document was not forwarded to you.' });
    }

    doc.status = 'REVIEWED';
    doc.remarks = remarks;
    await doc.save();

    // Notify student
    await createNotification({
      recipient: doc.scholarId,
      title: '📋 Additional Document Reviewed',
      message: `Your additional document "${doc.title}" has been reviewed by Prof. ${req.user.name} with remarks: "${remarks}"`,
      type: 'SUCCESSFUL_ACTION',
      link: 'documents'
    });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/additional-documents/thesis/:thesisId — Faculty/HOD views documents for a specific thesis
const getDocumentsByThesis = async (req, res) => {
  try {
    const { thesisId } = req.params;
    const thesis = await Thesis.findById(thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis context not found.' });

    const query = { thesisId };

    const isScholar = thesis.scholarId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (!isScholar && !isAdmin && req.user.role !== 'STUDENT') {
      query.forwardedTo = req.user._id;
    }

    const docs = await AdditionalDocument.find(query)
      .populate('scholarId', 'name email username profile')
      .populate('forwardedTo', 'name email role subRole')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  getForwardedDocuments,
  getDocumentsByThesis,
  reviewDocument
};

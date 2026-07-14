const mongoose = require('mongoose');

const appInstallLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userInfo: {
      name: { type: String, default: 'Anonymous' },
      email: { type: String, default: 'N/A' },
      role: { type: String, default: 'N/A' }
    },
    portal: {
      type: String,
      required: true // 'SCHOLAR_SYNC' | 'SCHOLAR_TRACK'
    },
    targetApp: {
      type: String,
      required: true // 'SCHOLAR_SYNC' | 'SCHOLAR_TRACK'
    },
    installType: {
      type: String,
      default: 'Native' // 'Native' | 'Manual'
    },
    userAgent: {
      type: String,
      default: ''
    },
    operatingSystem: {
      type: String,
      default: 'Unknown'
    },
    browserName: {
      type: String,
      default: 'Unknown'
    },
    deviceType: {
      type: String,
      default: 'Desktop' // 'Mobile' | 'Tablet' | 'Desktop'
    },
    screenResolution: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: ''
    },
    timezone: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    location: {
      country: { type: String, default: 'Unknown' },
      region: { type: String, default: 'Unknown' },
      city: { type: String, default: 'Unknown' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AppInstallLog', appInstallLogSchema);

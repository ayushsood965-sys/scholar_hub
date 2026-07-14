const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppInstallLog = require('../models/AppInstallLog');

// POST /api/install-logs — Create a new install log
const createLog = async (req, res) => {
  try {
    const {
      portal,
      targetApp,
      installType,
      userAgent,
      operatingSystem,
      browserName,
      deviceType,
      screenResolution,
      language,
      timezone
    } = req.body;

    let user = null;
    let userInfo = { name: 'Anonymous', email: 'N/A', role: 'N/A' };

    // Decode token if present
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const dbUser = await User.findById(decoded.id).select('-password');
        if (dbUser) {
          user = dbUser._id;
          userInfo = {
            name: dbUser.name || 'Unknown',
            email: dbUser.username || 'N/A',
            role: dbUser.role || 'N/A'
          };
        }
      } catch (err) {
        console.error('Error verifying JWT for install log:', err.message);
      }
    }

    // Resolve client IP
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip === '::1' || ip === '127.0.0.1') {
      ip = ''; // empty local IP for public API lookup
    }

    // Resolve location using GeoIP
    let location = { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
    if (ip) {
      try {
        // Query ip-api (free, no key required for public endpoints)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`);
        if (response.ok) {
          const geo = await response.json();
          if (geo.status === 'success') {
            location = {
              country: geo.country || 'Unknown',
              region: geo.regionName || 'Unknown',
              city: geo.city || 'Unknown'
            };
          }
        }
      } catch (geoError) {
        console.error('Failed to resolve GeoIP location:', geoError.message);
      }
    }

    // Save install log
    const log = await AppInstallLog.create({
      user,
      userInfo,
      portal,
      targetApp,
      installType,
      userAgent,
      operatingSystem,
      browserName,
      deviceType,
      screenResolution,
      language,
      timezone,
      ipAddress: ip || '127.0.0.1',
      location
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/install-logs — Retrieve logs (SUPER_ADMIN only)
const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await AppInstallLog.countDocuments();
    const logs = await AppInstallLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createLog,
  getLogs
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Role is not authorized' });
    }
    // HOD is a superset of FACULTY — allow HOD wherever FACULTY is permitted
    const userRole = req.user.role;
    const allowed = roles.includes(userRole) || (userRole === 'HOD' && roles.includes('FACULTY'));
    if (!allowed) {
      return res.status(403).json({ message: 'Role is not authorized' });
    }
    next();
  };
};

module.exports = { protect, authorize };

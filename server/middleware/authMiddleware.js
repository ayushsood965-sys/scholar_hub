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
      return next();
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
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;

    // Resolve if user acts as HOD
    const isHOD = userRole === 'HOD' || userSubRole === 'HOD';

    let allowed = false;
    if (roles.includes(userRole)) {
      allowed = true;
    } else if (isHOD && roles.includes('HOD')) {
      allowed = true;
    } else if (isHOD && roles.includes('FACULTY')) {
      // HOD is a superset of FACULTY
      allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ message: 'Role is not authorized' });
    }
    next();
  };
};

module.exports = { protect, authorize };

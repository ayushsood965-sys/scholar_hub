const Department = require('../models/Department');

const requireDepartment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Admins and Super Admins can operate globally or pass departmentId in query/body
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      const targetDeptId = req.query.departmentId || req.body.departmentId;
      if (targetDeptId) {
        req.user.departmentId = targetDeptId;
      }
      return next();
    }

    // For other roles, resolve the string-based department on req.user
    if (!req.user.department) {
      return res.status(400).json({ message: 'User does not belong to any department' });
    }

    const dept = await Department.findOne({
      $or: [
        { name: req.user.department },
        { code: req.user.department }
      ]
    });

    if (!dept) {
      return res.status(404).json({ 
        message: `Department configuration not found for '${req.user.department}'` 
      });
    }

    req.user.departmentId = dept._id.toString();
    next();
  } catch (error) {
    console.error('Error in requireDepartment middleware:', error);
    res.status(500).json({ message: 'Internal server error resolving department' });
  }
};

module.exports = requireDepartment;

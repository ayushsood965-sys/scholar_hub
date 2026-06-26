const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check if account is active
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact your department HOD.' });
    }

    if (await user.matchPassword(password)) {
      // Proactively ensure seeded users have a welcome notification
      const { getWelcomeNotificationData } = require('./notificationController');
      const welcomeData = getWelcomeNotificationData(user);
      await createNotification({
        recipient: user._id,
        title: welcomeData.title,
        message: welcomeData.message,
        type: 'WELCOME',
        link: welcomeData.link
      });

      res.json({
        _id: user._id, name: user.name, username: user.username,
        role: user.role, subRole: user.subRole, department: user.department,
        isActive: user.isActive, isVerified: user.isVerified, profileCompleted: user.profileCompleted,
        avatarUrl: user.avatarUrl, profile: user.profile,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  const { name, username, password, role, department, phoneNumber } = req.body;
  try {
    if (await User.findOne({ username })) {
      return res.status(400).json({ 
        message: 'You are already registered on the ScholarSync or ScholarTrack portal. Please use your existing credentials to log in.' 
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Clean and validate Indian phone number format
    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian phone number (starts with 6-9).' });
    }
    const tenDigits = cleanedPhone.slice(-10);
    const formattedPhone = `+91 ${tenDigits.slice(0, 5)}-${tenDigits.slice(5)}`;

    // Constraint: Only one HOD can exist per department
    if (role === 'HOD') {
      const activeHod = await User.findOne({ role: 'HOD', department, isActive: true });
      if (activeHod) {
        return res.status(400).json({ 
          message: 'HOD already exists for this department. Please disable the existing HOD\'s ID before creating a new one.' 
        });
      }
    }

    const user = await User.create({ 
      name, username, password, role: role || 'STUDENT', department,
      profile: { phoneNumber: formattedPhone }
    });

    const { getWelcomeNotificationData } = require('./notificationController');
    const welcomeData = getWelcomeNotificationData(user);
    await createNotification({
      recipient: user._id,
      title: welcomeData.title,
      message: welcomeData.message,
      type: 'WELCOME',
      link: welcomeData.link
    });

    res.status(201).json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      isActive: user.isActive, isVerified: user.isVerified, profileCompleted: user.profileCompleted,
      avatarUrl: user.avatarUrl, profile: user.profile,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/faculty — list all faculty (for admin supervisor dropdown)
const getFacultyList = async (req, res) => {
  try {
    const query = { role: { $in: ['FACULTY', 'HOD'] }, isActive: true };
    // HOD and FACULTY should only see users from their own department
    if (req.user.role === 'HOD' || req.user.role === 'FACULTY') {
      query.department = req.user.department;
    }
    const faculty = await User.find(query).select('name username role subRole department isActive isVerified');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/profile — Update Profile Details
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profileData = { ...req.body };
    if (profileData.phoneNumber) {
      const cleanedPhone = profileData.phoneNumber.trim().replace(/[\s\-()]/g, '');
      const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleanedPhone)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit Indian phone number (starts with 6-9).' });
      }
      const tenDigits = cleanedPhone.slice(-10);
      profileData.phoneNumber = `+91 ${tenDigits.slice(0, 5)}-${tenDigits.slice(5)}`;
    }

    if (!user.profile) {
      user.profile = {};
    }
    Object.keys(profileData).forEach(key => {
      user.profile[key] = profileData[key];
    });
    user.profileCompleted = true;
    user.markModified('profile');
    user.markModified('profile.qualifications');
    await user.save();

    res.json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      isActive: user.isActive, isVerified: user.isVerified, profileCompleted: user.profileCompleted,
      avatarUrl: user.avatarUrl, profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/users/:id/active — Toggle user activity (HOD / Super Admin action)
const toggleUserActive = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // HODs, ADMINs, or SUPER_ADMINs can toggle active status
    if (!['HOD', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (req.user.role === 'HOD' && req.user.department !== targetUser.department) {
      return res.status(403).json({ message: 'Not authorized. Can only manage users in your own department.' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    res.json({ message: `User account is now ${targetUser.isActive ? 'active' : 'disabled'}.`, user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/dept-users — Get all users inside HOD's department
const getDeptUsers = async (req, res) => {
  try {
    if (req.user.role !== 'HOD' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Action restricted to HOD.' });
    }
    const query = req.user.role === 'ADMIN' ? {} : { department: req.user.department };
    const users = await User.find(query).select('name username role department isActive isVerified profileCompleted');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/all-users — Get all users across the institution (Super Admin only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Action restricted to Super Admin.' });
    }
    const users = await User.find().select('name username role subRole department isActive isVerified profileCompleted profile');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/create-user — Super Admin creates a new user directly
const adminCreateUser = async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Action restricted to Super Admin.' });
    }
    const { name, username, password, role, subRole, department } = req.body;
    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: 'Name, Username, Password, and Role are required' });
    }

    // Check duplicate username
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: 'Username / Email already registered' });
    }

    // Unique HOD constraint check
    if (role === 'HOD' || (role === 'FACULTY' && subRole === 'HOD')) {
      const activeHOD = await User.findOne({
        department,
        $or: [{ role: 'HOD' }, { role: 'FACULTY', subRole: 'HOD' }],
        isActive: true
      });
      if (activeHOD) {
        return res.status(400).json({
          message: 'HOD already exists for this department. Please disable the existing HOD\'s ID before creating a new one.'
        });
      }
    }

    const newUser = await User.create({
      name,
      username,
      password,
      role,
      subRole: role === 'FACULTY' ? (subRole || 'SUPERVISOR') : null,
      department,
      isActive: true,
      profileCompleted: false
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/auth/users/:id — Super Admin deletes user
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Action restricted to Super Admin.' });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/profile/avatar — Upload and update profile avatar image
const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'Please select a profile picture' });

    user.avatarUrl = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      isActive: user.isActive, isVerified: user.isVerified, profileCompleted: user.profileCompleted,
      avatarUrl: user.avatarUrl, profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me — Fetch current authenticated user details
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      isActive: user.isActive, isVerified: user.isVerified, profileCompleted: user.profileCompleted,
      avatarUrl: user.avatarUrl, profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/profile/document — Upload educational certificate PDF/image
const uploadDocument = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'Please select a file to upload' });

    const { docType } = req.body;
    if (!docType) return res.status(400).json({ message: 'docType parameter is required' });

    const fileUrl = `/uploads/${req.file.filename}`;

    if (!user.profile) user.profile = {};
    if (!user.profile.qualifications) user.profile.qualifications = {};

    if (docType === 'class10') {
      if (!user.profile.qualifications.class10) user.profile.qualifications.class10 = {};
      user.profile.qualifications.class10.certificateUrl = fileUrl;
    } else if (docType === 'class12') {
      if (!user.profile.qualifications.class12) user.profile.qualifications.class12 = {};
      user.profile.qualifications.class12.certificateUrl = fileUrl;
    } else if (docType === 'graduation') {
      if (!user.profile.qualifications.graduation) user.profile.qualifications.graduation = {};
      user.profile.qualifications.graduation.certificateUrl = fileUrl;
    } else if (docType === 'postGraduation') {
      if (!user.profile.qualifications.postGraduation) user.profile.qualifications.postGraduation = {};
      user.profile.qualifications.postGraduation.certificateUrl = fileUrl;
    } else if (docType === 'netJrf') {
      if (!user.profile.qualifications.netJrf) user.profile.qualifications.netJrf = {};
      user.profile.qualifications.netJrf.certificateUrl = fileUrl;
    } else if (docType === 'mphil') {
      if (!user.profile.qualifications.mphil) user.profile.qualifications.mphil = {};
      user.profile.qualifications.mphil.certificateUrl = fileUrl;
    } else if (docType === 'other') {
      if (!user.profile.qualifications.other) user.profile.qualifications.other = {};
      user.profile.qualifications.other.certificateUrl = fileUrl;
    } else if (docType.startsWith('fellowship_')) {
      const index = parseInt(docType.split('_')[1], 10);
      if (!user.profile.qualifications.fellowships) user.profile.qualifications.fellowships = [];
      const fellowships = [...user.profile.qualifications.fellowships];
      if (!fellowships[index]) fellowships[index] = {};
      fellowships[index] = { ...fellowships[index], certificateUrl: fileUrl };
      user.profile.qualifications = {
        ...user.profile.qualifications,
        fellowships
      };
    } else if (docType.startsWith('otherQuals_')) {
      const index = parseInt(docType.split('_')[1], 10);
      if (!user.profile.qualifications.otherQuals) user.profile.qualifications.otherQuals = [];
      const otherQuals = [...user.profile.qualifications.otherQuals];
      if (!otherQuals[index]) otherQuals[index] = {};
      otherQuals[index] = { ...otherQuals[index], certificateUrl: fileUrl };
      user.profile.qualifications = {
        ...user.profile.qualifications,
        otherQuals
      };
    }

    user.markModified('profile');
    user.markModified('profile.qualifications');
    await user.save();

    res.json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      isActive: user.isActive, isVerified: user.isVerified, profileCompleted: user.profileCompleted,
      avatarUrl: user.avatarUrl, profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/students — Filter and fetch department scholars
const getStudentsFiltered = async (req, res) => {
  try {
    const { department, session, degreeType, degreeName, subject } = req.query;

    const query = {
      role: 'STUDENT',
      isActive: true
    };

    if (req.user.role === 'SUPER_ADMIN') {
      if (department) query.department = department;
    } else {
      query.department = req.user.department;
    }

    if (session) {
      query['profile.academicSession'] = session;
    }
    if (degreeType) {
      query['profile.degreeType'] = degreeType;
    }
    if (degreeName) {
      query['profile.degreeName'] = { $regex: new RegExp(degreeName, 'i') };
    }
    if (subject) {
      query['profile.subject'] = { $regex: new RegExp(subject, 'i') };
    }

    const students = await User.find(query).select('name username department profile isVerified profileCompleted');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/users/:id/verify — Verify a user account (HOD or Super Admin action)
const verifyUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // HODs, ADMINs, or SUPER_ADMINs can verify
    if (!['HOD', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (req.user.role === 'HOD' && req.user.department !== targetUser.department) {
      return res.status(403).json({ message: 'Not authorized. Can only verify users in your own department.' });
    }

    targetUser.isVerified = true;
    await targetUser.save();

    // Notify the student that their account has been verified
    await createNotification({
      recipient: targetUser._id,
      title: '✅ Account Verified',
      message: 'Your account has been verified by the HOD. You can now access all features of the ScholarTrack portal.',
      type: 'ACCOUNT_VERIFIED',
      link: 'profile'
    });

    res.json({ message: `User account has been verified.`, user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, register, getFacultyList, updateProfile, toggleUserActive, getDeptUsers, getAllUsers, adminCreateUser, deleteUser, uploadAvatar, uploadDocument, verifyUser, getMe, getStudentsFiltered };

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const { createNotification } = require('./notificationController');

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password, portal } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check if account is active
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact your department HOD.' });
    }

    // Determine if user is a PhD candidate
    const isPhD = user.profile?.isPhD === true;

    // Portal-specific student verification logic
    if (user.role === 'STUDENT') {
      if (portal === 'sync') {
        // ScholarSync portal: only PhD candidates can log in
        if (!isPhD) {
          return res.status(403).json({
            message: 'This portal is exclusively for Ph.D. candidates. Non-PhD students must use the ScholarTrack portal for attendance and leave management.'
          });
        }
        // PhD candidates can always access ScholarSync (they need to complete profile here first)
      } else if (portal === 'track') {
        // ScholarTrack portal: PhD candidates must be verified by HOD on ScholarSync first
        if (isPhD && user.isVerified === false) {
          return res.status(403).json({
            message: 'Your ScholarSync ID has not been verified by the HOD yet. Please complete your profile on ScholarSync and wait for HOD approval before logging in to ScholarTrack.'
          });
        }
        // Non-PhD students can always access ScholarTrack
      }
    }

    if (await user.matchPassword(password)) {
      // Proactively ensure seeded users have a welcome notification (if they don't already have one)
      const Notification = require('../models/Notification');
      const welcomeExists = await Notification.findOne({ recipient: user._id, type: 'WELCOME' });
      if (!welcomeExists) {
        const { getWelcomeNotificationData } = require('./notificationController');
        const welcomeData = getWelcomeNotificationData(user);
        await createNotification({
          recipient: user._id,
          title: welcomeData.title,
          message: welcomeData.message,
          type: 'WELCOME',
          link: welcomeData.link
        });
      }

      // Resolve departmentId for client-side filtering
      let userDepartmentId = null;
      if (user.department) {
        const dept = await Department.findOne({ $or: [{ name: user.department }, { code: user.department }] });
        if (dept) userDepartmentId = dept._id;
      }

      res.json({
        _id: user._id, name: user.name, username: user.username,
        role: user.role, subRole: user.subRole, department: user.department,
        departmentId: userDepartmentId,
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
  const { name, username, password, role, department, phoneNumber, academicSession, degreeType, degreeName, degreeTypeId, degreeTypeName, degreeNameId, degreeNameLabel, gender, category } = req.body;
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

     const profileData = { phoneNumber: formattedPhone };
    if (role === 'STUDENT') {
      if (academicSession) profileData.academicSession = academicSession;
      if (degreeType) profileData.degreeType = degreeType;
      if (degreeName) profileData.degreeName = degreeName;
      if (degreeTypeId) profileData.degreeTypeId = degreeTypeId;
      if (degreeTypeName) profileData.degreeTypeName = degreeTypeName;
      if (degreeNameId) profileData.degreeNameId = degreeNameId;
      if (degreeNameLabel) profileData.degreeNameLabel = degreeNameLabel;
      if (gender) profileData.gender = gender;
      if (category) profileData.category = category;

      // Set isPhD based on degree type
      const degreeTypeStr = (degreeTypeName || degreeType || '').toUpperCase();
      profileData.isPhD = degreeTypeStr.replace(/[^A-Z]/g, '').includes('PHD');
    }

    // For students, name may not be provided — derive from email prefix
    const finalName = name || (username ? username.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');

    const user = await User.create({ 
      name: finalName, username, password, role: role || 'STUDENT', department,
      profile: profileData
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

    // Resolve departmentId for client-side filtering
    let newUserDepartmentId = null;
    if (user.department) {
      const dept = await Department.findOne({ $or: [{ name: user.department }, { code: user.department }] });
      if (dept) newUserDepartmentId = dept._id;
    }

    res.status(201).json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      departmentId: newUserDepartmentId,
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

    // Recalculate isPhD if degree type was updated
    if (profileData.degreeType || profileData.degreeTypeName) {
      const degreeTypeStr = (profileData.degreeTypeName || profileData.degreeType || user.profile.degreeType || user.profile.degreeTypeName || '').toUpperCase();
      user.profile.isPhD = degreeTypeStr.replace(/[^A-Z]/g, '').includes('PHD');
    }

    if (req.body.profileCompleted === true) {
      user.profileCompleted = true;
      if (user.profile) {
        user.profile.rejectionRemarks = '';
      }
    }
    user.markModified('profile');
    user.markModified('profile.qualifications');
    user.markModified('profile.ipr');
    await user.save();

    // Resolve departmentId for client-side filtering
    let userDepartmentId = null;
    if (user.department) {
      const dept = await Department.findOne({ $or: [{ name: user.department }, { code: user.department }] });
      if (dept) userDepartmentId = dept._id;
    }

    res.json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department, departmentId: userDepartmentId,
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

    // Resolve departmentId for client-side filtering
    let avatarUserDepartmentId = null;
    if (user.department) {
      const dept = await Department.findOne({ $or: [{ name: user.department }, { code: user.department }] });
      if (dept) avatarUserDepartmentId = dept._id;
    }

    res.json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      departmentId: avatarUserDepartmentId,
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
    // Resolve departmentId for client-side filtering
    let meUserDepartmentId = null;
    if (user.department) {
      const dept = await Department.findOne({ $or: [{ name: user.department }, { code: user.department }] });
      if (dept) meUserDepartmentId = dept._id;
    }
    res.json({
      _id: user._id, name: user.name, username: user.username,
      role: user.role, subRole: user.subRole, department: user.department,
      departmentId: meUserDepartmentId,
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

// PUT /api/auth/users/:id/document — Upload certificate on behalf of student
const uploadStudentDocumentByAdmin = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (!req.file) return res.status(400).json({ message: 'Please select a file to upload' });

    const { docType } = req.body;
    if (!docType) return res.status(400).json({ message: 'docType parameter is required' });

    const fileUrl = `/uploads/${req.file.filename}`;

    if (!student.profile) student.profile = {};
    if (!student.profile.qualifications) student.profile.qualifications = {};

    if (docType === 'class10') {
      if (!student.profile.qualifications.class10) student.profile.qualifications.class10 = {};
      student.profile.qualifications.class10.certificateUrl = fileUrl;
    } else if (docType === 'class12') {
      if (!student.profile.qualifications.class12) student.profile.qualifications.class12 = {};
      student.profile.qualifications.class12.certificateUrl = fileUrl;
    } else if (docType === 'graduation') {
      if (!student.profile.qualifications.graduation) student.profile.qualifications.graduation = {};
      student.profile.qualifications.graduation.certificateUrl = fileUrl;
    } else if (docType === 'postGraduation') {
      if (!student.profile.qualifications.postGraduation) student.profile.qualifications.postGraduation = {};
      student.profile.qualifications.postGraduation.certificateUrl = fileUrl;
    } else if (docType === 'netJrf') {
      if (!student.profile.qualifications.netJrf) student.profile.qualifications.netJrf = {};
      student.profile.qualifications.netJrf.certificateUrl = fileUrl;
    } else if (docType === 'mphil') {
      if (!student.profile.qualifications.mphil) student.profile.qualifications.mphil = {};
      student.profile.qualifications.mphil.certificateUrl = fileUrl;
    } else if (docType === 'other') {
      if (!student.profile.qualifications.other) student.profile.qualifications.other = {};
      student.profile.qualifications.other.certificateUrl = fileUrl;
    } else if (docType.startsWith('fellowship_')) {
      const index = parseInt(docType.split('_')[1], 10);
      if (!student.profile.qualifications.fellowships) student.profile.qualifications.fellowships = [];
      const fellowships = [...student.profile.qualifications.fellowships];
      if (!fellowships[index]) fellowships[index] = {};
      fellowships[index] = { ...fellowships[index], certificateUrl: fileUrl };
      student.profile.qualifications.fellowships = fellowships;
    } else if (docType.startsWith('otherQuals_')) {
      const index = parseInt(docType.split('_')[1], 10);
      if (!student.profile.qualifications.otherQuals) student.profile.qualifications.otherQuals = [];
      const otherQuals = [...student.profile.qualifications.otherQuals];
      if (!otherQuals[index]) otherQuals[index] = {};
      otherQuals[index] = { ...otherQuals[index], certificateUrl: fileUrl };
      student.profile.qualifications.otherQuals = otherQuals;
    }

    student.markModified('profile');
    student.markModified('profile.qualifications');
    await student.save();

    res.json({
      message: 'Certificate uploaded successfully!',
      certificateUrl: fileUrl,
      qualifications: student.profile.qualifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/students — Filter and fetch department scholars
const getStudentsFiltered = async (req, res) => {
  try {
    const { department, session, degreeType, degreeName, subject, name, email, shNo, phoneNumber, semesterId } = req.query;

    const query = {
      role: 'STUDENT'
    };

    if (req.user.role === 'SUPER_ADMIN') {
      if (department) query.department = department;
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }
    } else {
      query.isActive = true;
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
    if (semesterId) {
      query['profile.semesterId'] = semesterId;
    }

    // Text search query conditions grouped with OR
    const textConditions = [];
    if (name) {
      textConditions.push({ name: { $regex: new RegExp(name, 'i') } });
      textConditions.push({ 'profile.fatherName': { $regex: new RegExp(name, 'i') } });
      textConditions.push({ 'profile.motherName': { $regex: new RegExp(name, 'i') } });
      textConditions.push({ 'profile.address': { $regex: new RegExp(name, 'i') } });
    }
    if (email) {
      textConditions.push({ username: { $regex: new RegExp(email, 'i') } });
    }
    if (shNo) {
      textConditions.push({ 'profile.shNo': { $regex: new RegExp(shNo, 'i') } });
    }
    if (phoneNumber) {
      textConditions.push({ 'profile.phoneNumber': { $regex: new RegExp(phoneNumber, 'i') } });
    }

    if (textConditions.length > 0) {
      query.$or = textConditions;
    }

    if (req.query.profileCompleted !== undefined) {
      query.profileCompleted = req.query.profileCompleted === 'true';
    }
    if (req.query.isVerified !== undefined) {
      query.isVerified = req.query.isVerified === 'true';
    }
    if (req.query.isPhD !== undefined) {
      if (req.query.isPhD === 'false') {
        query['profile.isPhD'] = { $ne: true };
        query['profile.degreeType'] = { $not: /PH\.?D/i };
      } else {
        query['profile.isPhD'] = true;
      }
    }

    const students = await User.find(query).select('name username department profile isVerified profileCompleted isActive');
    
    // Sort students by relevance
    const getRelevanceScore = (student) => {
      let score = 0;
      const studentName = (student.name || '').toLowerCase().trim();

      if (name) {
        const queryName = name.toLowerCase().trim();
        if (studentName === queryName) {
          score += 100; // Exact match of student name
        } else if (studentName.startsWith(queryName)) {
          score += 50;  // Starts with student name
        } else if (studentName.includes(queryName)) {
          score += 20;  // Contains student name
        }
        
        // Matches father/mother/address
        if (student.profile?.fatherName?.toLowerCase().includes(queryName)) score += 5;
        if (student.profile?.motherName?.toLowerCase().includes(queryName)) score += 5;
        if (student.profile?.address?.toLowerCase().includes(queryName)) score += 2;
      }

      if (email) {
        const queryEmail = email.toLowerCase().trim();
        const studentEmail = (student.username || '').toLowerCase().trim();
        if (studentEmail === queryEmail) score += 80;
        else if (studentEmail.includes(queryEmail)) score += 30;
      }

      if (shNo) {
        const querySh = shNo.toLowerCase().trim();
        const studentSh = (student.profile?.shNo || '').toLowerCase().trim();
        if (studentSh === querySh) score += 80;
        else if (studentSh.includes(querySh)) score += 30;
      }

      if (phoneNumber) {
        const queryPhone = phoneNumber.toLowerCase().trim();
        const studentPhone = (student.profile?.phoneNumber || '').toLowerCase().trim();
        if (studentPhone === queryPhone) score += 80;
        else if (studentPhone.includes(queryPhone)) score += 30;
      }

      return score;
    };

    students.sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));
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

// PUT /api/auth/users/:id/reject — Reject a user profile request (HOD or Admin/Super Admin action)
const rejectUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // HODs, ADMINs, or SUPER_ADMINs can reject
    if (!['HOD', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (req.user.role === 'HOD' && req.user.department !== targetUser.department) {
      return res.status(403).json({ message: 'Not authorized. Can only reject users in your own department.' });
    }

    const { remarks } = req.body;
    if (!remarks) {
      return res.status(400).json({ message: 'Rejection remarks are required.' });
    }

    targetUser.isVerified = false;
    targetUser.profileCompleted = false;
    if (!targetUser.profile) {
      targetUser.profile = {};
    }
    targetUser.profile.rejectionRemarks = remarks;
    targetUser.markModified('profile');
    await targetUser.save();

    // Update associated Thesis record to REJECTED so the student can resubmit their registration
    if (targetUser.role === 'STUDENT') {
      const Thesis = require('../models/Thesis');
      const thesis = await Thesis.findOne({ scholarId: targetUser._id });
      if (thesis) {
        thesis.status = 'REJECTED';
        if (!thesis.registrationHistory) thesis.registrationHistory = [];
        thesis.registrationHistory.push({
          action: 'REGISTRATION_REJECTED',
          actorName: req.user.name,
          actorRole: req.user.role || 'HOD',
          remarks: remarks,
          timestamp: new Date()
        });
        await thesis.save();
      }
    }

    // Notify the student that their profile verification has been rejected
    await createNotification({
      recipient: targetUser._id,
      title: '❌ Profile Verification Rejected',
      message: `Your profile verification has been rejected by HOD. Remarks: ${remarks}`,
      type: 'PROFILE_INCOMPLETE',
      link: 'profile'
    });

    res.json({ message: `User registration has been rejected and sent back to student.`, user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/users/:id/profile — HOD / Admin updates a specific student's profile
const updateUserProfileByHod = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // HODs, ADMINs, or SUPER_ADMINs can edit profile
    if (!['HOD', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (req.user.role === 'HOD' && req.user.department !== targetUser.department) {
      return res.status(403).json({ message: 'Not authorized. Can only edit profiles in your own department.' });
    }

    const { name, username, department, isVerified, isActive, role, subRole, ...profileData } = req.body;

    if (name !== undefined) targetUser.name = name;
    if (username !== undefined) targetUser.username = username;
    if (department !== undefined) targetUser.department = department;
    if (isVerified !== undefined) targetUser.isVerified = isVerified;
    if (isActive !== undefined) targetUser.isActive = isActive;
    if (role !== undefined) targetUser.role = role;
    if (subRole !== undefined) targetUser.subRole = subRole;

    if (!targetUser.profile) {
      targetUser.profile = {};
    }
    Object.keys(profileData).forEach(key => {
      targetUser.profile[key] = profileData[key];
    });

    // Recalculate isPhD if degree type was updated
    if (profileData.degreeType || profileData.degreeTypeName) {
      const degreeTypeStr = (profileData.degreeTypeName || profileData.degreeType || targetUser.profile.degreeType || targetUser.profile.degreeTypeName || '').toUpperCase();
      targetUser.profile.isPhD = degreeTypeStr.replace(/[^A-Z]/g, '').includes('PHD');
    }

    targetUser.markModified('profile');
    if (profileData.qualifications) {
      targetUser.markModified('profile.qualifications');
    }
    await targetUser.save();

    // If PhD and thesis exists, we should update the thesis title/department etc. as well if they were modified in the profile
    if (targetUser.profile.isPhD) {
      const Thesis = require('../models/Thesis');
      const thesis = await Thesis.findOne({ scholarId: targetUser._id });
      if (thesis) {
        if (profileData.thesisTitle) thesis.title = profileData.thesisTitle;
        if (profileData.thesisSummary) thesis.abstract = profileData.thesisSummary;
        if (profileData.specialization) thesis.specialization = profileData.specialization;
        if (department !== undefined) thesis.department = department;
        await thesis.save();
      }
    }

    res.json({ message: 'Profile updated successfully.', user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, register, getFacultyList, updateProfile, toggleUserActive, getDeptUsers, getAllUsers, adminCreateUser, deleteUser, uploadAvatar, uploadDocument, verifyUser, rejectUser, updateUserProfileByHod, getMe, getStudentsFiltered, uploadStudentDocumentByAdmin };

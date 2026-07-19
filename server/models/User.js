const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'],
      default: 'STUDENT',
      required: true,
    },
    subRole: {
      type: String,
      enum: ['SUPERVISOR', 'HOD', null],
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    profile: {
      shNo: { type: String, default: '' },
      phoneNumber: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      academicBackground: { type: String, default: '' },
      areaOfInterest: { type: String, default: '' },
      designation: { type: String, default: '' },
      specialization: { type: String, default: '' },
      officeRoom: { type: String, default: '' },
      yearsOfService: { type: Number, default: 0 },
      additionalResponsibilities: { type: String, default: '' },
      dob: { type: String, default: '' },
      gender: { type: String, default: '' },
      category: { type: String, default: '' },
      fatherName: { type: String, default: '' },
      motherName: { type: String, default: '' },
      nationality: { type: String, default: '' },
      admissionDate: { type: String, default: '' },
      enrollmentNumber: { type: String, default: '' },
      erpAdmissionNo: { type: String, default: '' },
      phdMode: { type: String, default: '' },
      preferredGuideId: { type: String, default: '' },
      thesisTitle: { type: String, default: '' },
      thesisSummary: { type: String, default: '' },
      thesisKeywords: { type: String, default: '' },
      isPhD: { type: Boolean, default: false },
      rejectionRemarks: { type: String, default: '' },
      degreeTypeId: { type: String, default: '' },
      degreeNameId: { type: String, default: '' },
      semesterId: { type: String, default: '' },
      degreeType: { type: String, default: '' },
      degreeName: { type: String, default: '' },
      subject: { type: String, default: '' },
      academicSession: { type: String, default: '' },
      qualifications: { type: mongoose.Schema.Types.Mixed, default: {} },
      expertise: { type: [String], default: [] },
      experience: { type: mongoose.Schema.Types.Mixed, default: [] },
      awards: { type: mongoose.Schema.Types.Mixed, default: [] },
      thesesSupervised: { type: mongoose.Schema.Types.Mixed, default: [] },
      professionalBodies: { type: mongoose.Schema.Types.Mixed, default: [] },
      committees: { type: mongoose.Schema.Types.Mixed, default: [] },
      projects: { type: mongoose.Schema.Types.Mixed, default: [] },
      publications: { type: mongoose.Schema.Types.Mixed, default: [] },
      ipr: { type: mongoose.Schema.Types.Mixed, default: [] },
      privacySettings: {
        type: mongoose.Schema.Types.Mixed,
        default: {
          dob: true,
          gender: true,
          category: true,
          nationality: true,
          fatherName: true,
          motherName: true,
          phoneNumber: true,
          address: true,
          class10: true,
          class10Doc: true,
          class12: true,
          class12Doc: true,
          graduation: true,
          graduationDoc: true,
          postGraduation: true,
          postGraduationDoc: true,
          mphil: true,
          mphilDoc: true,
          netJrf: true,
          netJrfDoc: true,
          specialization: true,
          areaOfInterest: true,
          thesisTitle: true,
          thesisSummary: true,
          expertise: true,
          experience: true,
          awards: true,
          publications: true,
          projects: true,
          ipr: true,
          thesesSupervised: true,
          officeRoom: true,
          yearsOfService: true,
          additionalResponsibilities: true
        }
      },
    },
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchLab',
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// Encrypt password and auto-generate SS No before saving
userSchema.pre('save', async function () {
  // 1. Password hashing
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // 2. Auto-generate SH no. for student if missing
  if (this.role === 'STUDENT' && (!this.profile || !this.profile.shNo)) {
    if (!this.profile) this.profile = {};
    let isUnique = false;
    let shNo = '';
    while (!isUnique) {
      shNo = Math.floor(100000000 + Math.random() * 900000000).toString();
      const existing = await this.constructor.findOne({ 'profile.shNo': shNo });
      if (!existing) {
        isUnique = true;
      }
    }
    this.profile.shNo = shNo;
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ department: 1, role: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;

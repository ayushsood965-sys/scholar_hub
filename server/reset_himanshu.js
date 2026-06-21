require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Thesis = require('./models/Thesis');

connectDB().then(async () => {
  try {
    const student = await User.findOne({ username: 'himanshunegi@gmail.com' });
    if (!student) {
      console.error('Student himanshunegi@gmail.com not found');
      process.exit(1);
    }

    // Set student account to unverified (so HOD has to verify profile)
    student.isVerified = false;
    await student.save();
    console.log(`Student user account isVerified reset to false.`);

    // Find and update Thesis
    const thesis = await Thesis.findOne({ scholarId: student._id });
    if (thesis) {
      thesis.status = 'REGISTRATION_PENDING';
      thesis.enrollmentVerified = false;
      thesis.supervisorId = null;
      thesis.courseworkStatus = 'NOT_SUBMITTED';
      thesis.courseworkCompleted = false;
      thesis.courseworkDetails = {
        researchEthics: [],
        researchMethodology: [],
        elective: [],
        others: []
      };
      thesis.courseworkUploadProof = null;
      thesis.courseworkApprovals = {
        facultyApproved: false,
        facultyApproverId: null,
        facultyApprovedAt: null,
        hodApproved: false,
        hodApproverId: null,
        hodApprovedAt: null
      };
      // Clear coursework/synopsis milestones if they were auto-generated or progressed
      // Wait, let's keep details clean
      await thesis.save();
      console.log(`Thesis reset to REGISTRATION_PENDING, enrollmentVerified: false, supervisorId: null.`);
    } else {
      console.log('No thesis found for this student');
    }
  } catch (err) {
    console.error('Error resetting Himanshu Negi:', err);
  }

  process.exit(0);
});

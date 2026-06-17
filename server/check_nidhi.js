require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ username: 'nidhi.patel.fors.student7@gmail.com' });
    if (!user) {
      console.log('❌ Nidhi Patel not found.');
      process.exit(1);
    }
    console.log('User found:', {
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      department: user.department,
      admissionDate: user.profile?.admissionDate
    });

    const thesis = await Thesis.findOne({ scholarId: user._id });
    if (!thesis) {
      console.log('❌ Thesis not found.');
      process.exit(1);
    }
    console.log('Thesis found:', {
      _id: thesis._id,
      status: thesis.status,
      preSubmissionSeminar: thesis.preSubmissionSeminar
    });

    const milestones = await Milestone.find({ thesisId: thesis._id });
    console.log('Milestones found:', milestones.map(m => ({
      type: m.type,
      status: m.status,
      title: m.title
    })));

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
    process.exit(1);
  }
}
run();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const Publication = require('./models/Publication');
const RACReview = require('./models/RACReview');
const ChangeRequest = require('./models/ChangeRequest');

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for clearing...');

    // Clear students, faculties, and HODs (all users except SUPER_ADMIN)
    const userRes = await User.deleteMany({ role: { $ne: 'SUPER_ADMIN' } });
    console.log(`Deleted ${userRes.deletedCount} student and faculty user entries.`);

    // Clear all other related lifecycle records
    const thesisRes = await Thesis.deleteMany({});
    const milestoneRes = await Milestone.deleteMany({});
    const pubRes = await Publication.deleteMany({});
    const racRes = await RACReview.deleteMany({});
    const changeRes = await ChangeRequest.deleteMany({});

    console.log(`Cleared:
- ${thesisRes.deletedCount} Thesis records
- ${milestoneRes.deletedCount} Milestone records
- ${pubRes.deletedCount} Publication logs
- ${racRes.deletedCount} RAC Review meetings
- ${changeRes.deletedCount} Change request forms`);

    console.log('✅ Database entries for students, faculties, and HODs have been successfully cleared!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDatabase();

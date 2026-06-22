require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Publication = require('./models/Publication');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scholar_hub');
  console.log('Connected to DB');

  const student = await User.findOne({ username: 'himanshunegi@gmail.com' });
  if (!student) {
    console.error('Student himanshunegi@gmail.com not found');
    process.exit(1);
  }

  const pubs = await Publication.find({ scholarId: student._id });
  console.log(`Publications found for Himanshu Negi (${pubs.length}):`);
  pubs.forEach(p => {
    console.log(`  - Title: "${p.title}" | Type: ${p.type} | Status: ${p.status} | Remarks: "${p.remarks}"`);
  });

  process.exit(0);
};

run();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const connectDB = require('./config/db');

connectDB().then(async () => {
  try {
    const user = await User.findOne({ name: 'pawan sharma1' });
    if (!user) {
      console.log('❌ User pawan sharma1 not found.');
      process.exit(1);
    }
    const thesis = await Thesis.findOne({ scholarId: user._id });
    if (!thesis) {
      console.log('❌ Thesis not found.');
      process.exit(1);
    }
    const synopsis = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
    if (!synopsis) {
      console.log('❌ Synopsis milestone not found.');
      process.exit(1);
    }
    
    synopsis.status = 'PENDING_HOD';
    await synopsis.save();
    console.log(`✅ Successfully reset pawan sharma1's synopsis milestone status to PENDING_HOD!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
});

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function updateAllPasswords() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);

    console.log('Hashing "Password123" with bcrypt (10 rounds)...');
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash('Password123', salt);

    console.log(`Updating all ${totalUsers} users to new password...`);
    const updateResult = await User.updateMany({}, { $set: { password: newHash } });
    console.log(`Updated ${updateResult.modifiedCount} user records.`);

    // Verification check on key accounts
    const testAccounts = [
      'ayushtest@gmail.com',
      'pradeepkumar@gmail.com',
      'mahinderkumar@gmail.com',
      'admin'
    ];

    console.log('\nVerifying login with "Password123" for key accounts:');
    for (const username of testAccounts) {
      const u = await User.findOne({ username });
      if (u) {
        const matches = await u.matchPassword('Password123');
        console.log(`- ${username} (${u.role}): matches="Password123"? -> ${matches ? '✅ PASS' : '❌ FAIL'}`);
      } else {
        console.log(`- ${username}: Not found in DB`);
      }
    }

    // Pick 3 random users and verify
    const sampleUsers = await User.aggregate([{ $sample: { size: 3 } }]);
    console.log('\nVerifying random sample users:');
    for (const su of sampleUsers) {
      const u = await User.findById(su._id);
      const matches = await u.matchPassword('Password123');
      console.log(`- ${u.username} (${u.role}): matches="Password123"? -> ${matches ? '✅ PASS' : '❌ FAIL'}`);
    }

    console.log('\n========================================================');
    console.log('🎉 ALL USERS SUCCESSFULLY UPDATED TO Password123!');
    console.log('========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error updating passwords:', err);
    process.exit(1);
  }
}

updateAllPasswords();

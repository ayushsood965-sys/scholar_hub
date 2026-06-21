require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

connectDB().then(async () => {
  const users = await User.find({
    $or: [
      { 'profile.qualifications.otherQuals': { $exists: true, $ne: [] } },
      { 'profile.qualifications.other': { $exists: true } }
    ]
  });
  console.log(JSON.stringify(users.map(u => ({
    name: u.name,
    otherQuals: u.profile?.qualifications?.otherQuals,
    other: u.profile?.qualifications?.other
  })), null, 2));
  process.exit(0);
});

require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

connectDB().then(async () => {
  const user = await User.findOne({ username: 'pawansharma1@gmail.com' });
  console.log('User found:', JSON.stringify(user, null, 2));
  process.exit(0);
});

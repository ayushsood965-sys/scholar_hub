require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Publication = require('./models/Publication');
const Thesis = require('./models/Thesis');

connectDB().then(async () => {
  const user = await User.findOne({ username: 'himanshunegi@gmail.com' });
  if (!user) { console.log('User not found'); process.exit(1); }
  console.log('User:', user.name, user._id);
  
  const thesis = await Thesis.findOne({ scholarId: user._id });
  if (!thesis) { console.log('No thesis found'); process.exit(1); }
  console.log('Thesis:', thesis.title, thesis._id);
  
  const pubs = await Publication.find({ thesisId: thesis._id });
  console.log(`Found ${pubs.length} publications to delete`);
  
  const result = await Publication.deleteMany({ thesisId: thesis._id });
  console.log(`Deleted ${result.deletedCount} publications`);
  
  process.exit(0);
});

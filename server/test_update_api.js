require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Publication = require('./models/Publication');
const Thesis = require('./models/Thesis');
const axios = require('axios');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scholar_hub');
  console.log('Connected to DB');

  const student = await User.findOne({ username: 'himanshunegi@gmail.com' });
  const thesis = await Thesis.findOne({ scholarId: student._id });

  let pub = await Publication.findOne({ scholarId: student._id, title: /Conference Output 2/ });
  if (!pub) {
    console.error('Publication not found');
    process.exit(1);
  }

  // Set to DRAFT
  pub.status = 'DRAFT';
  await pub.save();
  console.log('Set publication to DRAFT');

  // Log in as student
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    username: 'himanshunegi@gmail.com',
    password: 'password123'
  });
  const token = loginRes.data.token;
  console.log('Logged in as student');

  // Call submit-drafts
  const submitRes = await axios.put(`http://localhost:5000/api/publications/thesis/${thesis._id}/submit-drafts`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Submit drafts response:', submitRes.data);

  // Re-fetch from DB
  const updatedPub = await Publication.findById(pub._id);
  console.log('Status in DB after submitting drafts:', updatedPub.status);

  process.exit(0);
};

run().catch(err => {
  console.error(err.response?.data || err);
  process.exit(1);
});

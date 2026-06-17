const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB!');
    const users = await User.find().select('username role department');
    console.log('--- ALL REGISTERED USERS ---');
    console.log(users);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });

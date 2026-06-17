const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Publication = require('./models/Publication');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB!');
    const piyush = await User.findOne({ username: /piyush/i });
    if (!piyush) {
      console.log('Piyush user not found!');
      mongoose.connection.close();
      return;
    }
    console.log('Piyush User:', piyush);
    
    const pubs = await Publication.find({ scholarId: piyush._id });
    console.log('Piyush Publications:', pubs);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });

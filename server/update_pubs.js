const mongoose = require('mongoose');
require('dotenv').config();
const Publication = require('./models/Publication');

const gibberishIds = [
  '6a1d9f92923e4117c316c89c',
  '6a1d9fbb923e4117c316c8aa',
  '6a1d9fd7923e4117c316c8b9',
  '6a1d9ff1923e4117c316c8c9',
  '6a1da00c923e4117c316c8da'
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB!');
    const res = await Publication.deleteMany({ _id: { $in: gibberishIds } });
    console.log('Deleted gibberish publications count:', res.deletedCount);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });

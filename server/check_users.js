const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const DegreeTypeMaster = require('./models/attendance/DegreeTypeMaster');
const DegreeNameMaster = require('./models/attendance/DegreeNameMaster');
const SemesterMaster = require('./models/attendance/SemesterMaster');
const AcademicSessionMaster = require('./models/attendance/AcademicSessionMaster');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB!');
    const dts = await DegreeTypeMaster.find();
    const dns = await DegreeNameMaster.find();
    const sems = await SemesterMaster.find();
    const sessions = await AcademicSessionMaster.find();
    console.log('--- DEGREE TYPES ---', dts);
    console.log('--- DEGREE NAMES ---', dns);
    console.log('--- SEMESTERS ---', sems);
    console.log('--- SESSIONS ---', sessions);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });

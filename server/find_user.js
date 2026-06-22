require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Thesis = require('./models/Thesis');

connectDB().then(async () => {
  const user = await User.findOne({ username: 'himanshunegi@gmail.com' });
  if (!user) {
    console.log('Himanshu user not found');
    process.exit(1);
  }
  console.log('Himanshu User:', {
    _id: user._id,
    name: user.name,
    username: user.username,
    role: user.role,
    department: user.department
  });

  const thesis = await Thesis.findOne({ scholarId: user._id });
  if (!thesis) {
    console.log('Thesis not found');
    process.exit(1);
  }
  console.log('Thesis:', {
    _id: thesis._id,
    title: thesis.title,
    status: thesis.status,
    supervisorId: thesis.supervisorId,
    department: thesis.department
  });

  if (thesis.supervisorId) {
    const supervisor = await User.findById(thesis.supervisorId);
    console.log('Supervisor:', {
      _id: supervisor?._id,
      name: supervisor?.name,
      username: supervisor?.username,
      role: supervisor?.role,
      subRole: supervisor?.subRole
    });
  }

  const hod = await User.findOne({ 
    department: thesis.department, 
    $or: [{ role: 'HOD' }, { subRole: 'HOD' }] 
  });
  console.log('HOD:', {
    _id: hod?._id,
    name: hod?.name,
    username: hod?.username,
    role: hod?.role,
    subRole: hod?.subRole
  });

  process.exit(0);
});

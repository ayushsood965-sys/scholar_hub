require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Seed Departments
    const departmentsToSeed = [
      { name: 'Department of Chemistry', code: 'CHEM' },
      { name: 'Department of Computer Science', code: 'CS' },
      { name: 'Department of Data Science and Artificial Intelligence', code: 'DSAI' },
      { name: 'Department of Electronics', code: 'ELEX' },
      { name: 'Department of Geography', code: 'GEOG' },
      { name: 'Department of Mathematics', code: 'MATH' },
      { name: 'Department of Physics', code: 'PHYS' },
      { name: 'Department of Archaeology (Ancient History & Archaeology)', code: 'ARCH' },
      { name: 'Department of Defence and Strategic Studies', code: 'DSS' },
      { name: 'Department of Economics', code: 'ECON' },
      { name: 'Department of History', code: 'HIST' },
      { name: 'Department of Journalism and Mass Communications', code: 'JMC' },
      { name: 'Department of Library and Information Science', code: 'LIS' },
      { name: 'Department of Life Long Learning', code: 'LLL' },
      { name: 'Department of Political Science', code: 'POL' },
      { name: 'Department of Population Studies', code: 'POPS' },
      { name: 'Department of Psychology', code: 'PSY' },
      { name: 'Department of Public Administration', code: 'PA' },
      { name: 'Department of Sociology and Social Work', code: 'SSW' },
      { name: 'Department of Yoga Studies', code: 'YS' },
      { name: 'Department of Bio Sciences', code: 'BIOS' },
      { name: 'Department of Bio Technology', code: 'BIOT' },
      { name: 'Department of Environmental Science', code: 'ENVS' },
      { name: 'Department of Forensic Science', code: 'FORS' },
      { name: 'Department of Microbiology', code: 'MICRO' },
      { name: 'Centre for Buddhist Studies', code: 'CBS' },
      { name: 'Department of English', code: 'ENG' },
      { name: 'Department of Hindi', code: 'HIN' },
      { name: 'Department of Modern European and Foreign Languages', code: 'MEFL' },
      { name: 'Department of Sanskrit', code: 'SKT' },
      { name: 'Department of Applied Sciences & Humanities', code: 'ASH' },
      { name: 'Department of Civil Engineering', code: 'CIVIL' },
      { name: 'Department of Computer Science Engineering', code: 'CSE' },
      { name: 'Department of Electrical Engineering', code: 'EE' },
      { name: 'Department of Electronics and Communication', code: 'ECE' },
      { name: 'Department of Information Technology', code: 'IT' },
      { name: 'Department of Commerce', code: 'COMM' },
      { name: 'Institute of Vocational Studies', code: 'IVS' },
      { name: 'International Institute of Management Studies (HPU Business School)', code: 'IIMS' },
      { name: 'Department of Education', code: 'EDU' },
      { name: 'Department of Physical Education', code: 'PE' },
      { name: 'Department of Teacher Education', code: 'TE' },
      { name: 'Department of Performing Arts (Music, Dance, and Dramatics)', code: 'DPA' },
      { name: 'Department of Visual Arts (Painting, Commercial Art, and Sculpture)', code: 'DVA' },
      { name: 'Department of Law', code: 'LAW' },
      { name: 'Department of Interdisciplinary Studies', code: 'IDS' }
    ];

    let deptsAdded = 0;
    for (const d of departmentsToSeed) {
      const exists = await Department.findOne({ $or: [{ name: d.name }, { code: d.code }] });
      if (!exists) {
        await Department.create(d);
        deptsAdded++;
      }
    }
    console.log(`✅ Seeded ${deptsAdded} new academic departments!`);

    // Ensure Super Admin exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Super Administrator',
        username: 'admin',
        password: 'admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        profileCompleted: true
      });
      console.log('👑 Auto-seeded Super Admin user (admin/admin)!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();

require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const FacultyMaster = require('../models/FacultyMaster');

function generateCode(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

async function migrate() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/scholar_hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Faculty migration...');

    // Fetch all current departments
    const departments = await Department.find({});
    console.log(`Found ${departments.length} departments to migrate.`);

    // Extract unique faculty names
    const uniqueFacultyNames = [...new Set(
      departments
        .map(d => d.faculty)
        .filter(f => typeof f === 'string' && f.trim() !== '')
    )];

    console.log('Unique faculty names identified:', uniqueFacultyNames);

    // Create or update FacultyMaster documents
    const facultyMap = {};
    for (const name of uniqueFacultyNames) {
      const code = generateCode(name);
      let faculty = await FacultyMaster.findOne({ name });
      if (!faculty) {
        faculty = await FacultyMaster.create({ name, code });
        console.log(`Created FacultyMaster: "${name}" [Code: ${code}]`);
      } else {
        console.log(`FacultyMaster already exists: "${name}"`);
      }
      facultyMap[name] = faculty._id;
    }

    // Map each department to its FacultyMaster id
    let updatedCount = 0;
    for (const d of departments) {
      if (d.faculty && facultyMap[d.faculty]) {
        d.facultyId = facultyMap[d.faculty];
        await d.save();
        updatedCount++;
      }
    }

    console.log(`Successfully mapped ${updatedCount} departments to FacultyMaster IDs!`);
    mongoose.connection.close();
    console.log('Migration complete. Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

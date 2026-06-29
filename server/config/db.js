const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    // Attempt connecting to the configured URI, with a fast 2-second timeout
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await backfillSHNos();
    await backfillPhdStatus();
  } catch (error) {
    console.error(`❌ Connection to MongoDB Atlas failed: ${error.message}`);
    process.exit(1);
  }
};

const backfillSHNos = async () => {
  try {
    const User = require('../models/User');
    const studentsWithoutSH = await User.find({
      role: 'STUDENT',
      $or: [
        { 'profile.shNo': { $exists: false } },
        { 'profile.shNo': '' },
        { 'profile.shNo': null }
      ]
    });
    if (studentsWithoutSH.length > 0) {
      console.log(`[Migration] Found ${studentsWithoutSH.length} students without SH no. Backfilling...`);
      for (const student of studentsWithoutSH) {
        if (!student.profile) student.profile = {};
        // Trigger save to fire pre-save hook and generate a unique SH no.
        await student.save();
      }
      console.log(`[Migration] Successfully backfilled SH no. for all students.`);
    }
  } catch (err) {
    console.error('Error backfilling SH no.:', err);
  }
};

const backfillPhdStatus = async () => {
  try {
    const User = require('../models/User');
    const DegreeTypeMaster = require('../models/attendance/DegreeTypeMaster');

    // Find the PhD degree type
    const phdType = await DegreeTypeMaster.findOne({ code: 'PHD', isActive: true });

    if (phdType) {
      // Set isPhD = true only for students with PhD degree type
      const phdResult = await User.updateMany(
        {
          role: 'STUDENT',
          $or: [
            { 'profile.degreeTypeId': phdType._id },
            { 'profile.degreeType': { $regex: /phd/i } }
          ]
        },
        { $set: { 'profile.isPhD': true } }
      );
      if (phdResult.modifiedCount > 0) {
        console.log(`[Migration] Set isPhD = true for ${phdResult.modifiedCount} PhD students.`);
      }
    }

    // Set isPhD = false for all students who don't have isPhD explicitly set to true
    // This catches: isPhD missing, isPhD: false, or isPhD incorrectly set
    const nonPhdResult = await User.updateMany(
      {
        role: 'STUDENT',
        'profile.isPhD': { $ne: true }
      },
      { $set: { 'profile.isPhD': false } }
    );
    if (nonPhdResult.modifiedCount > 0) {
      console.log(`[Migration] Set isPhD = false for ${nonPhdResult.modifiedCount} non-PhD students.`);
    }
  } catch (err) {
    console.error('Error backfilling isPhD status:', err);
  }
};

module.exports = connectDB;

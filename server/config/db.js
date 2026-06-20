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
    console.log(`⚠️ Connection to primary MongoDB failed: ${error.message}`);
    console.log('🔄 Spawning an in-memory MongoDB server as fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      // Override the environment variable so other components use the in-memory server
      process.env.MONGO_URI = mongoUri;
      
      const conn = await mongoose.connect(mongoUri);
      console.log(`🚀 In-Memory MongoDB Started and Connected: ${mongoUri}`);
      await backfillSHNos();
      await backfillPhdStatus();
    } catch (innerError) {
      console.error(`❌ Fallback in-memory MongoDB failed: ${innerError.message}`);
      process.exit(1);
    }
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
    const result = await User.updateMany(
      { role: 'STUDENT', $or: [{ 'profile.isPhD': { $exists: false } }, { 'profile.isPhD': false }] },
      { $set: { 'profile.isPhD': true } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Migration] Backfilled isPhD = true for ${result.modifiedCount} students.`);
    }
  } catch (err) {
    console.error('Error backfilling isPhD status:', err);
  }
};

module.exports = connectDB;

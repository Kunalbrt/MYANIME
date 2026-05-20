require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
   await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4,
  retryWrites: true
});
    console.log('MongoDB connected ✅');
  } catch (err) {
    console.error('Connection failed ❌:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
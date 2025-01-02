
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);  
  }
};

module.exports = connectDB; 

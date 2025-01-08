const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI||`mongodb://127.0.0.1:27017/application`; 
    console.log('Attempting to connect with URI:', uri);
    const connection = await mongoose
    .connect(`mongodb://127.0.0.1:27017/application`)
    .then(async() => {
      console.log(
        "mongodb connected"
      );
      console.log("sssssss"
      );
    })
    .catch((err) => {
      const errorMessage = 
        "MongoDB connection error: " + err

      console.log(errorMessage);
    });
    console.log(`MongoDB Connected: `);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);  
  }
  console.log(process.env.MONGO_URI)
};

module.exports = connectDB;
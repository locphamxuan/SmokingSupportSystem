const mongoose = require('mongoose');
require('dotenv').config();

// Sử dụng connection string từ biến môi trường hoặc mặc định
const mongoURI = process.env.MONGO_URI || 'mongodb://loc:loc123@127.0.0.1:27017/SmokingSupportPlatform';

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection URI:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    process.exit(1);
  }
};

module.exports = connectDB; 
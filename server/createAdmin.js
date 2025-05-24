const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SmokingSupportPlatform';

async function createAdmin() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin account
    const adminData = {
      username: 'admin',
      email: 'admin@smokingsupport.com',
      password: 'admin123456', // Change this to a secure password
      phoneNumber: '0123456789',
      address: 'System Administrator',
      role: 'admin'
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Admin account created successfully!');
    console.log('Username:', adminData.username);
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role:', adminData.role);
    console.log('\n⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

createAdmin(); 
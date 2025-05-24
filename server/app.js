const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

// Set MONGO_URI directly if not loaded from .env
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SmokingSupportPlatform';

const app = express();
const adminRoutes = require('./routes/adminRoutes');
// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);

// Debug environment variables
console.log('Environment variables:');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('Using connection string:', process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SmokingSupportPlatform');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SmokingSupportPlatform';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    console.log('Database:', mongoURI);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Full error details:', JSON.stringify(err, null, 2));
    process.exit(1);
  });

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
}); 
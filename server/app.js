// Server application configuration
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();
<<<<<<< HEAD
=======
const { connectDB } = require('./db');
>>>>>>> Loc

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Test route
=======
// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));

>>>>>>> Loc
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});
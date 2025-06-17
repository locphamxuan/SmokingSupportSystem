const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();
const { connectDB } = require('./db');
const coachRoutes = require('./routes/coachRoutes');
const bookingController = require('./controllers/bookingController');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
console.log('Setting up /api/bookings route...');
app.use('/api/booking', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hlv', coachRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/api/test-user/:id', async (req, res) => {
  try {
    const { sql } = require('./db');
    const userId = req.params.id;
    
    const result = await sql.query`
      SELECT Id, Username, cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, 
             dailyCigarettes, dailyFeeling
      FROM Users WHERE Id = ${userId}
    `;
    
    res.json({ 
      message: 'Direct DB query test',
      userId: userId,
      found: result.recordset.length > 0,
      data: result.recordset[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
const express = require('express');
const connectDB = require('./db');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
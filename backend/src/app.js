const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const transactionRoutes = require('./routes/transaction.routes');
const { connectDB } = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', transactionRoutes);

// Base health check
app.get('/', (req, res) => {
  res.json({ message: 'Mini Fintech Dashboard API is running.' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;

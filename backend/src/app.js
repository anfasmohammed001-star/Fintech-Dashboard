const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const transactionRoutes = require('./routes/transaction.routes');
const { connectDB } = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// Strip Vercel Services route prefix if present
app.use((req, res, next) => {
  if (req.url.startsWith('/_/backend')) {
    req.url = req.url.substring('/_/backend'.length);
    if (req.url === '' || req.url.startsWith('?')) {
      req.url = '/' + req.url;
    }
  }
  next();
});

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

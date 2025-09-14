const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const budgetRoutes = require('./routes/budgets');
const insightsRoutes = require('./routes/insights');
const settingsRoutes = require('./routes/settings');
const bankAccountRoutes = require('./routes/bankAccounts');
const digitalWalletRoutes = require('./routes/digitalWallets');
const mlRoutes = require('./routes/ml');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());

// Static folder for uploaded images
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/digital-wallets', digitalWalletRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();



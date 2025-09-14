const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

// Helper function to get test user ID
async function getTestUserId() {
  const testUser = await User.findOne({ email: 'test@example.com' });
  return testUser ? testUser._id : null;
}

// GET /api/stats - totals and breakdowns for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { from, to, category, paymentMethod } = req.query;

    const match = { userId }
    if (from || to) {
      match.date = {}
      if (from) match.date.$gte = new Date(from)
      if (to) match.date.$lt = new Date(to)
    }
    if (category) match.category = category
    if (paymentMethod) match.paymentMethod = paymentMethod

    // Totals by type
    const totalsByType = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    const totalIncome = totalsByType.find(t => t._id === 'income')?.total || 0;
    const totalExpense = totalsByType.find(t => t._id === 'expense')?.total || 0;
    const totalBalance = totalIncome - totalExpense;

    // Last 12 months monthly sums
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const monthly = await Transaction.aggregate([
      { $match: { ...match, date: { ...(match.date || {}), $gte: since } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    // Category breakdown (pie)
    const byCategory = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      totals: { income: totalIncome, expense: totalExpense, balance: totalBalance },
      monthly,
      categories: byCategory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/stats/trends?days=30 - daily income/expense and top categories within window
router.get('/trends', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const days = Math.max(1, Math.min(365, parseInt(req.query.days || '30', 10)));

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));

    // Daily totals for income and expense
    const daily = await Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lt: new Date(end.getTime() + 24*60*60*1000) } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' }, d: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);

    // Top expense categories in window
    const topCategories = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: start, $lt: new Date(end.getTime() + 24*60*60*1000) } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
    ]);

    res.json({
      range: { start, end },
      daily,
      topCategories,
    });
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/stats/transactions - Get all transactions with pagination and filters
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { type, category, page = 1, limit = 10, search, from, to, paymentMethod } = req.query;
    
    const query = { userId };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lt = new Date(to);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/stats/transactions - Create new transaction
router.post('/transactions', auth, async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;
    const userId = req.userId;
    
    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required' });
    }
    
    const transaction = new Transaction({
      userId,
      type,
      amount: parseFloat(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date()
    });
    
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/stats/transactions/:id - Update transaction
router.put('/transactions/:id', auth, async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;
    const userId = req.userId;
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId },
      { type, amount: parseFloat(amount), category, description, date: new Date(date) },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/stats/transactions/:id - Delete transaction
router.delete('/transactions/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test route without authentication - uses test user data
router.get('/test', async (req, res) => {
  try {
    const userId = await getTestUserId();
    if (!userId) {
      return res.status(404).json({ message: 'Test user not found' });
    }

    const { from, to, category, paymentMethod } = req.query;

    const match = { userId }
    if (from || to) {
      match.date = {}
      if (from) match.date.$gte = new Date(from)
      if (to) match.date.$lt = new Date(to)
    }
    if (category) match.category = category
    if (paymentMethod) match.paymentMethod = paymentMethod

    // Totals by type
    const totalsByType = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    const totalIncome = totalsByType.find(t => t._id === 'income')?.total || 0;
    const totalExpense = totalsByType.find(t => t._id === 'expense')?.total || 0;
    const totalBalance = totalIncome - totalExpense;

    // Last 12 months monthly sums
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const monthly = await Transaction.aggregate([
      { $match: { ...match, date: { ...(match.date || {}), $gte: since } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    // Category breakdown (pie)
    const byCategory = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      totals: { income: totalIncome, expense: totalExpense, balance: totalBalance },
      monthly,
      categories: byCategory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test route for transactions
router.get('/test/transactions', async (req, res) => {
  try {
    const userId = await getTestUserId();
    if (!userId) {
      return res.status(404).json({ message: 'Test user not found' });
    }

    const { type, category, page = 1, limit = 10, search, from, to, paymentMethod } = req.query;
    
    const query = { userId };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lt = new Date(to);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test route for trends
router.get('/test/trends', async (req, res) => {
  try {
    const userId = await getTestUserId();
    if (!userId) {
      return res.status(404).json({ message: 'Test user not found' });
    }

    const days = Math.max(1, Math.min(365, parseInt(req.query.days || '30', 10)));

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));

    // Daily totals for income and expense
    const daily = await Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lt: new Date(end.getTime() + 24*60*60*1000) } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' }, d: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);

    // Top expense categories in window
    const topCategories = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: start, $lt: new Date(end.getTime() + 24*60*60*1000) } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
    ]);

    res.json({
      range: { start, end },
      daily,
      topCategories,
    });
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



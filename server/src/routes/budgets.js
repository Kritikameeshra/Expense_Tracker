const express = require('express')
const auth = require('../middleware/auth')
const Budget = require('../models/Budget')
const Transaction = require('../models/Transaction')

const router = express.Router()

function getPeriodRange(period, fromDate) {
  const now = fromDate ? new Date(fromDate) : new Date()
  if (period === 'weekly') {
    const day = now.getDay() // 0..6
    const start = new Date(now)
    start.setDate(now.getDate() - day)
    start.setHours(0,0,0,0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    end.setHours(0,0,0,0)
    return { start, end }
  }
  // monthly default
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start, end }
}

// List budgets with spent calculation
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId
    const budgets = await Budget.find({ userId }).sort({ createdAt: -1 })

    const enriched = []
    for (const b of budgets) {
      const { start, end } = getPeriodRange(b.period, b.startDate)
      const spentAgg = await Transaction.aggregate([
        { $match: { userId, type: 'expense', category: b.category, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      const spent = spentAgg[0]?.total || 0
      enriched.push({ ...b.toObject(), spent, remaining: Math.max(0, b.amount - spent) })
    }

    res.json({ budgets: enriched })
  } catch (e) {
    console.error('List budgets error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create or update budget (upsert by unique index)
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.userId
    const { category, period = 'monthly', amount } = req.body
    if (!category || !amount) return res.status(400).json({ message: 'Category and amount are required' })
    const { start } = getPeriodRange(period)
    const budget = await Budget.findOneAndUpdate(
      { userId, category, period, startDate: start },
      { $set: { amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    res.status(201).json(budget)
  } catch (e) {
    console.error('Create budget error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId
    const deleted = await Budget.findOneAndDelete({ _id: req.params.id, userId })
    if (!deleted) return res.status(404).json({ message: 'Budget not found' })
    res.json({ message: 'Budget deleted' })
  } catch (e) {
    console.error('Delete budget error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router



const express = require('express')
const auth = require('../middleware/auth')
const Transaction = require('../models/Transaction')

const router = express.Router()

// Basic predictive insight: compare current month vs avg of last 3 months per category
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId
    const now = new Date()
    const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1)

    const start3 = new Date(now.getFullYear(), now.getMonth() - 3, 1)

    const agg = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: start3 } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' }, category: '$category' },
          total: { $sum: '$amount' }
        }
      }
    ])

    const byCategory = new Map()
    for (const row of agg) {
      const key = row._id.category
      const ym = `${row._id.y}-${row._id.m}`
      const rec = byCategory.get(key) || { months: {}, current: 0 }
      rec.months[ym] = row.total
      byCategory.set(key, rec)
    }

    const currentYm = `${startCurrent.getFullYear()}-${startCurrent.getMonth() + 1}`
    const insights = []
    for (const [cat, rec] of byCategory.entries()) {
      const totals = Object.entries(rec.months)
      const last3 = totals
        .filter(([ym]) => ym !== currentYm)
        .slice(-3)
        .map(([, v]) => v)
      const avg = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : 0
      const current = rec.months[currentYm] || 0
      if (avg > 0 && current > avg * 1.1) {
        const percent = Math.round(((current - avg) / avg) * 100)
        insights.push({ category: cat, message: `You are spending ${percent}% above your usual on ${cat}.`, current, average: avg })
      }
    }

    res.json({ insights })
  } catch (e) {
    console.error('Insights error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router



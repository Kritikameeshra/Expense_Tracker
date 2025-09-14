const express = require('express')
const auth = require('../middleware/auth')
const mlService = require('../services/mlService')

const router = express.Router()

// Auto-categorize a transaction
router.post('/categorize', auth, async (req, res) => {
  try {
    const { description } = req.body
    if (!description) {
      return res.status(400).json({ message: 'Description is required' })
    }

    const category = await mlService.autoCategorize(description, req.userId)
    res.json({ category })
  } catch (e) {
    console.error('Auto-categorize error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get expense predictions
router.get('/predictions', auth, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6
    const predictions = await mlService.predictExpenses(req.userId, months)
    res.json({ predictions })
  } catch (e) {
    console.error('Predictions error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Detect spending anomalies
router.get('/anomalies', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const anomalies = await mlService.detectAnomalies(req.userId, days)
    res.json({ anomalies })
  } catch (e) {
    console.error('Anomaly detection error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get saving suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const suggestions = await mlService.generateSavingSuggestions(req.userId)
    res.json({ suggestions })
  } catch (e) {
    console.error('Suggestions error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get comprehensive ML insights
router.get('/insights', auth, async (req, res) => {
  try {
    const [predictions, anomalies, suggestions] = await Promise.all([
      mlService.predictExpenses(req.userId),
      mlService.detectAnomalies(req.userId),
      mlService.generateSavingSuggestions(req.userId)
    ])

    res.json({
      predictions,
      anomalies: anomalies.slice(0, 5), // Top 5 anomalies
      suggestions: suggestions.slice(0, 5) // Top 5 suggestions
    })
  } catch (e) {
    console.error('ML insights error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Test route for ML insights without authentication
router.get('/test/insights', async (req, res) => {
  try {
    // Get test user ID
    const User = require('../models/User');
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      return res.status(404).json({ message: 'Test user not found' });
    }

    const [predictions, anomalies, suggestions] = await Promise.all([
      mlService.predictExpenses(testUser._id),
      mlService.detectAnomalies(testUser._id),
      mlService.generateSavingSuggestions(testUser._id)
    ])

    res.json({
      predictions,
      anomalies: anomalies.slice(0, 5), // Top 5 anomalies
      suggestions: suggestions.slice(0, 5) // Top 5 suggestions
    })
  } catch (e) {
    console.error('ML insights error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

const express = require('express')
const auth = require('../middleware/auth')
const BankAccount = require('../models/BankAccount')

const router = express.Router()

// List user's bank accounts
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await BankAccount.find({ userId: req.userId, isActive: true })
    res.json({ accounts })
  } catch (e) {
    console.error('List bank accounts error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Add new bank account (manual entry for now)
router.post('/', auth, async (req, res) => {
  try {
    const { bankName, accountType, accountNumber, routingNumber, balance, currency } = req.body
    if (!bankName || !accountType || !accountNumber) {
      return res.status(400).json({ message: 'Bank name, account type, and account number are required' })
    }
    
    const account = new BankAccount({
      userId: req.userId,
      bankName,
      accountType,
      accountNumber: accountNumber.slice(-4), // Store only last 4 digits
      routingNumber,
      balance: balance || 0,
      currency: currency || 'USD'
    })
    
    await account.save()
    res.status(201).json(account)
  } catch (e) {
    console.error('Create bank account error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update bank account
router.put('/:id', auth, async (req, res) => {
  try {
    const { bankName, accountType, balance, currency } = req.body
    const account = await BankAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { bankName, accountType, balance, currency },
      { new: true }
    )
    
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' })
    }
    
    res.json(account)
  } catch (e) {
    console.error('Update bank account error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete bank account (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await BankAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    )
    
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' })
    }
    
    res.json({ message: 'Bank account deleted successfully' })
  } catch (e) {
    console.error('Delete bank account error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Sync bank account (placeholder for Plaid integration)
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const account = await BankAccount.findOne({ _id: req.params.id, userId: req.userId })
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' })
    }
    
    // TODO: Implement Plaid integration here
    // For now, just update lastSync timestamp
    account.lastSync = new Date()
    await account.save()
    
    res.json({ message: 'Sync completed', lastSync: account.lastSync })
  } catch (e) {
    console.error('Sync bank account error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

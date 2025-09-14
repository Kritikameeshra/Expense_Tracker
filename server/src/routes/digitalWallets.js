const express = require('express')
const auth = require('../middleware/auth')
const DigitalWallet = require('../models/DigitalWallet')

const router = express.Router()

// List user's digital wallets
router.get('/', auth, async (req, res) => {
  try {
    const wallets = await DigitalWallet.find({ userId: req.userId, isActive: true })
    res.json({ wallets })
  } catch (e) {
    console.error('List digital wallets error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Add new digital wallet
router.post('/', auth, async (req, res) => {
  try {
    const { walletType, walletName, walletId, balance, currency, upiId, paypalEmail } = req.body
    if (!walletType || !walletName || !walletId) {
      return res.status(400).json({ message: 'Wallet type, name, and ID are required' })
    }
    
    const wallet = new DigitalWallet({
      userId: req.userId,
      walletType,
      walletName,
      walletId,
      balance: balance || 0,
      currency: currency || 'USD',
      upiId,
      paypalEmail
    })
    
    await wallet.save()
    res.status(201).json(wallet)
  } catch (e) {
    console.error('Create digital wallet error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update digital wallet
router.put('/:id', auth, async (req, res) => {
  try {
    const { walletName, balance, currency } = req.body
    const wallet = await DigitalWallet.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { walletName, balance, currency },
      { new: true }
    )
    
    if (!wallet) {
      return res.status(404).json({ message: 'Digital wallet not found' })
    }
    
    res.json(wallet)
  } catch (e) {
    console.error('Update digital wallet error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete digital wallet (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const wallet = await DigitalWallet.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    )
    
    if (!wallet) {
      return res.status(404).json({ message: 'Digital wallet not found' })
    }
    
    res.json({ message: 'Digital wallet deleted successfully' })
  } catch (e) {
    console.error('Delete digital wallet error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Sync digital wallet (placeholder for API integration)
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const wallet = await DigitalWallet.findOne({ _id: req.params.id, userId: req.userId })
    if (!wallet) {
      return res.status(404).json({ message: 'Digital wallet not found' })
    }
    
    // TODO: Implement actual wallet API integration here
    // For now, just update lastSync timestamp
    wallet.lastSync = new Date()
    await wallet.save()
    
    res.json({ message: 'Sync completed', lastSync: wallet.lastSync })
  } catch (e) {
    console.error('Sync digital wallet error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

const express = require('express')
const auth = require('../middleware/auth')
const User = require('../models/User')

const router = express.Router()

router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.userId).lean()
  res.json({ currency: user.currency || 'USD', locale: user.locale || 'en-US' })
})

router.put('/', auth, async (req, res) => {
  const { currency, locale } = req.body
  const user = await User.findByIdAndUpdate(req.userId, { currency, locale }, { new: true })
  res.json({ currency: user.currency, locale: user.locale })
})

module.exports = router



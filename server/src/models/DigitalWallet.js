const mongoose = require('mongoose')

const DigitalWalletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletType: { type: String, enum: ['paypal', 'google_pay', 'apple_pay', 'paytm', 'upi', 'stripe'], required: true },
    walletName: { type: String, required: true }, // User-friendly name
    walletId: { type: String, required: true }, // External wallet ID
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
    lastSync: { type: Date },
    // For API integration
    accessToken: { type: String }, // Encrypted access token
    refreshToken: { type: String }, // Encrypted refresh token
    expiresAt: { type: Date },
    // UPI specific
    upiId: { type: String }, // For UPI wallets
    // PayPal specific
    paypalEmail: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('DigitalWallet', DigitalWalletSchema)

const mongoose = require('mongoose')

const BankAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bankName: { type: String, required: true },
    accountType: { type: String, enum: ['checking', 'savings', 'credit', 'investment'], required: true },
    accountNumber: { type: String, required: true }, // Last 4 digits only for security
    routingNumber: { type: String }, // For US banks
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
    lastSync: { type: Date },
    // For Plaid-like integration
    plaidItemId: { type: String }, // Plaid item ID
    plaidAccountId: { type: String }, // Plaid account ID
    accessToken: { type: String }, // Encrypted access token
  },
  { timestamps: true }
)

module.exports = mongoose.model('BankAccount', BankAccountSchema)

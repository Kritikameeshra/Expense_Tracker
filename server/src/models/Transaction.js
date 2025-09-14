const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'general' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'bank', 'wallet'], default: 'cash', index: true },
    description: { type: String },
    date: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);



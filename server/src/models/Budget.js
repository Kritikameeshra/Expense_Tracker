const mongoose = require('mongoose')

const BudgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    period: { type: String, enum: ['monthly', 'weekly'], default: 'monthly', index: true },
    amount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
  },
  { timestamps: true }
)

BudgetSchema.index({ userId: 1, category: 1, period: 1, startDate: 1 }, { unique: true })

module.exports = mongoose.model('Budget', BudgetSchema)



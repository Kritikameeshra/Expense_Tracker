const Transaction = require('../models/Transaction')

class MLService {
  constructor() {
    this.categoryKeywords = {
      'Food': ['restaurant', 'food', 'dining', 'cafe', 'pizza', 'burger', 'coffee', 'lunch', 'dinner', 'breakfast', 'grocery', 'supermarket', 'market'],
      'Transport': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train', 'flight', 'airline', 'car', 'vehicle'],
      'Shopping': ['amazon', 'store', 'shop', 'mall', 'clothing', 'shoes', 'electronics', 'online', 'purchase', 'buy'],
      'Entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game', 'concert', 'theater', 'entertainment', 'fun'],
      'Bills': ['electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance', 'utility', 'bill'],
      'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medicine', 'medical', 'health', 'clinic', 'dental'],
      'Education': ['school', 'university', 'course', 'book', 'education', 'tuition', 'learning', 'training']
    }
  }

  // Auto-categorize transaction based on description
  async autoCategorize(description, userId) {
    if (!description) return 'Other'

    const lowerDesc = description.toLowerCase()
    
    // Check against keyword patterns
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return category
      }
    }

    // ML-based categorization using user's historical data
    const userTransactions = await Transaction.find({ 
      userId, 
      description: { $exists: true, $ne: '' } 
    }).limit(100)

    if (userTransactions.length === 0) return 'Other'

    // Simple similarity-based categorization
    const categoryScores = {}
    
    for (const transaction of userTransactions) {
      if (!transaction.description) continue
      
      const similarity = this.calculateSimilarity(lowerDesc, transaction.description.toLowerCase())
      const category = transaction.category || 'Other'
      
      if (!categoryScores[category]) {
        categoryScores[category] = 0
      }
      categoryScores[category] += similarity
    }

    // Return category with highest score
    const bestCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)[0]

    return bestCategory && bestCategory[1] > 0.3 ? bestCategory[0] : 'Other'
  }

  // Calculate text similarity (simple Jaccard similarity)
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/))
    const words2 = new Set(text2.split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  // Predict next month's expenses based on historical data
  async predictExpenses(userId, months = 6) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const transactions = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    })

    // Group by category and calculate trends
    const categoryData = {}
    
    for (const transaction of transactions) {
      const category = transaction.category || 'Other'
      const month = transaction.date.toISOString().substring(0, 7) // YYYY-MM
      
      if (!categoryData[category]) {
        categoryData[category] = {}
      }
      
      if (!categoryData[category][month]) {
        categoryData[category][month] = 0
      }
      
      categoryData[category][month] += transaction.amount
    }

    // Calculate predictions
    const predictions = {}
    
    for (const [category, monthlyData] of Object.entries(categoryData)) {
      const amounts = Object.values(monthlyData)
      if (amounts.length < 2) continue
      
      // Simple linear trend calculation
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const trend = this.calculateTrend(amounts)
      
      predictions[category] = {
        predicted: Math.max(0, avg + trend),
        average: avg,
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
      }
    }

    return predictions
  }

  // Calculate trend (simple linear regression slope)
  calculateTrend(values) {
    if (values.length < 2) return 0
    
    const n = values.length
    const x = Array.from({length: n}, (_, i) => i)
    const y = values
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    return slope
  }

  // Detect spending anomalies
  async detectAnomalies(userId, days = 30) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const transactions = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 })

    const anomalies = []
    
    // Group by category for analysis
    const categoryData = {}
    
    for (const transaction of transactions) {
      const category = transaction.category || 'Other'
      if (!categoryData[category]) {
        categoryData[category] = []
      }
      categoryData[category].push(transaction.amount)
    }

    // Detect anomalies in each category
    for (const [category, amounts] of Object.entries(categoryData)) {
      if (amounts.length < 3) continue
      
      const sorted = [...amounts].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      const threshold = q3 + (1.5 * iqr)
      
      // Find transactions above threshold
      const categoryTransactions = transactions.filter(t => 
        (t.category || 'Other') === category && t.amount > threshold
      )
      
      for (const transaction of categoryTransactions) {
        anomalies.push({
          type: 'high_amount',
          category,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          threshold,
          severity: transaction.amount > threshold * 2 ? 'high' : 'medium'
        })
      }
    }

    // Detect unusual spending patterns (e.g., multiple large transactions in short time)
    const dailySpending = {}
    for (const transaction of transactions) {
      const day = transaction.date.toISOString().split('T')[0]
      if (!dailySpending[day]) {
        dailySpending[day] = 0
      }
      dailySpending[day] += transaction.amount
    }

    const dailyAmounts = Object.values(dailySpending)
    if (dailyAmounts.length > 0) {
      const avgDaily = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length
      const threshold = avgDaily * 3 // 3x average daily spending
      
      for (const [day, amount] of Object.entries(dailySpending)) {
        if (amount > threshold) {
          anomalies.push({
            type: 'high_daily_spending',
            amount,
            date: new Date(day),
            threshold,
            severity: amount > threshold * 2 ? 'high' : 'medium'
          })
        }
      }
    }

    return anomalies.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // Generate saving suggestions
  async generateSavingSuggestions(userId) {
    const predictions = await this.predictExpenses(userId)
    const suggestions = []

    for (const [category, data] of Object.entries(predictions)) {
      if (data.trend === 'increasing' && data.predicted > data.average * 1.2) {
        const potentialSavings = data.predicted - data.average
        suggestions.push({
          category,
          type: 'reduce_spending',
          message: `Consider reducing ${category} spending. You could save $${potentialSavings.toFixed(2)} next month.`,
          potentialSavings: potentialSavings,
          priority: potentialSavings > 100 ? 'high' : 'medium'
        })
      }
    }

    // Add general suggestions
    const totalPredicted = Object.values(predictions).reduce((sum, data) => sum + data.predicted, 0)
    const totalAverage = Object.values(predictions).reduce((sum, data) => sum + data.average, 0)
    
    if (totalPredicted > totalAverage * 1.1) {
      suggestions.push({
        type: 'budget_review',
        message: 'Your spending is trending upward. Consider reviewing your budget.',
        priority: 'medium'
      })
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
}

module.exports = new MLService()

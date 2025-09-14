import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export default function MLInsightsPage() {
  const [insights, setInsights] = useState({ predictions: {}, anomalies: [], suggestions: [] })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ monthly: [], categories: [], totals: { income: 0, expense: 0 } })
  const colors = ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#6366f1', '#06b6d4', '#db2777']

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const [mlRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/ml/test/insights'),
        axios.get('http://localhost:5000/api/stats/test')
      ])
      setInsights(mlRes.data)
      setStats(statsRes.data)
    } catch (e) {
      console.error('Load ML insights error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInsights() }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '📈'
      case 'decreasing': return '📉'
      default: return '➡️'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  // Month-over-Month expense data
  const momData = useMemo(() => {
    const map = new Map()
    for (const row of stats.monthly) {
      if (row._id.type !== 'expense') continue
      const key = `${row._id.y}-${row._id.m}`
      map.set(key, { label: `${row._id.m}/${row._id.y}`.padStart(7, '0'), expense: row.total })
    }
    return Array.from(map.values())
  }, [stats.monthly])

  // Expense-only categories for breakdown
  const expenseCats = useMemo(() => stats.categories.filter(c => c._id.type === 'expense').map(c => ({ name: c._id.category, value: c.total })), [stats.categories])

  // Simple text insights MoM
  const textInsights = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const get = (yy, mm, type) => stats.monthly.find(r => r._id.y === yy && r._id.m === mm && r._id.type === type)?.total || 0
    const expNow = get(y, m, 'expense')
    const incNow = get(y, m, 'income')
    let py = y, pm = m - 1; if (pm === 0) { pm = 12; py = y - 1 }
    const expPrev = get(py, pm, 'expense')
    const incPrev = get(py, pm, 'income')
    const savingsNow = incNow - expNow
    const savingsPrev = incPrev - expPrev
    const expChange = expPrev > 0 ? Math.round(((expNow - expPrev) / expPrev) * 100) : 0
    const savChange = savingsPrev !== 0 ? Math.round(((savingsNow - savingsPrev) / Math.abs(savingsPrev)) * 100) : 0
    return { expChange: isFinite(expChange) ? expChange : 0, savChange: isFinite(savChange) ? savChange : 0 }
  }, [stats.monthly])

  if (loading) {
    return <div className="muted">Loading AI insights...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Insights & Reports</h2>
        <button onClick={fetchInsights} className="btn">Refresh</button>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* MoM Expenses */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Month-over-Month Expenses</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={momData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Category Breakdown</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={expenseCats} outerRadius={110} label>
                  {expenseCats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Text Insights */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Highlights</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Your food spending increased by {Math.max(0, textInsights.expChange)}% this month.</li>
            <li>You saved {Math.max(0, textInsights.savChange)}% more than last month.</li>
          </ul>
        </div>
        {/* Predictions */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔮 Expense Predictions
          </h3>
          <p className="muted">AI predictions for next month based on your spending patterns</p>
          
          {Object.keys(insights.predictions).length === 0 ? (
            <div className="muted">No prediction data available yet. Add more transactions to get insights.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(insights.predictions).map(([category, data]) => (
                <div key={category} style={{ 
                  padding: 12, 
                  background: 'rgba(148,163,184,0.1)', 
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{category}</div>
                      <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                        Predicted: {formatCurrency(data.predicted)} | Average: {formatCurrency(data.average)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{getTrendIcon(data.trend)}</span>
                      <span style={{ 
                        fontSize: 12, 
                        padding: '4px 8px', 
                        borderRadius: 4,
                        background: data.trend === 'increasing' ? 'rgba(239,68,68,0.2)' : 
                                   data.trend === 'decreasing' ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
                        color: data.trend === 'increasing' ? '#ef4444' : 
                               data.trend === 'decreasing' ? '#22c55e' : '#6b7280'
                      }}>
                        {data.trend}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anomalies */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Spending Anomalies
          </h3>
          <p className="muted">Unusual spending patterns detected by AI</p>
          
          {insights.anomalies.length === 0 ? (
            <div className="muted">No anomalies detected. Your spending looks normal!</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {insights.anomalies.map((anomaly, index) => (
                <div key={index} style={{ 
                  padding: 12, 
                  background: 'rgba(239,68,68,0.1)', 
                  borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: getSeverityColor(anomaly.severity) }}>
                        {anomaly.type === 'high_amount' ? 'High Amount' : 'High Daily Spending'}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                        {anomaly.description && `${anomaly.description} - `}
                        {formatCurrency(anomaly.amount)}
                        {anomaly.category && ` in ${anomaly.category}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(anomaly.date).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: 12, 
                      padding: '4px 8px', 
                      borderRadius: 4,
                      background: getSeverityColor(anomaly.severity) + '20',
                      color: getSeverityColor(anomaly.severity)
                    }}>
                      {anomaly.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            💡 Saving Suggestions
          </h3>
          <p className="muted">AI-powered recommendations to help you save money</p>
          
          {insights.suggestions.length === 0 ? (
            <div className="muted">No suggestions available. Keep up the good spending habits!</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {insights.suggestions.map((suggestion, index) => (
                <div key={index} style={{ 
                  padding: 12, 
                  background: 'rgba(34,211,238,0.1)', 
                  borderRadius: 8,
                  border: '1px solid rgba(34,211,238,0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {suggestion.type === 'reduce_spending' ? 'Reduce Spending' : 'Budget Review'}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                        {suggestion.message}
                      </div>
                      {suggestion.potentialSavings && (
                        <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                          Potential savings: {formatCurrency(suggestion.potentialSavings)}
                        </div>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: 12, 
                      padding: '4px 8px', 
                      borderRadius: 4,
                      background: getPriorityColor(suggestion.priority) + '20',
                      color: getPriorityColor(suggestion.priority)
                    }}>
                      {suggestion.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

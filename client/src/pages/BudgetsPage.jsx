import { useEffect, useState } from 'react'
import axios from 'axios'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ category: '', period: 'monthly', amount: '' })

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/budgets', { headers: { Authorization: `Bearer ${token}` } })
      setBudgets(res.data.budgets || [])
    } catch (e) {
      console.error('Load budgets error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBudgets() }, [])

  const saveBudget = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.post('http://localhost:5000/api/budgets', form, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
      setForm({ category: '', period: 'monthly', amount: '' })
      fetchBudgets()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save budget')
    }
  }

  const deleteBudget = async (id) => {
    if (!confirm('Delete this budget?')) return
    const token = localStorage.getItem('token')
    await axios.delete(`http://localhost:5000/api/budgets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    fetchBudgets()
  }

  const percent = (spent, amount) => Math.min(100, Math.round((spent / Math.max(1, amount)) * 100))
  const progressColor = (p) => (p >= 100 ? '#ef4444' : p >= 75 ? '#f59e0b' : '#16a34a')

  const alerts = budgets
    .map(b => ({
      id: b._id,
      category: b.category,
      percent: percent(b.spent || 0, b.amount || 0),
      remaining: Math.max(0, (b.amount || 0) - (b.spent || 0)),
    }))
    .filter(x => x.percent >= 80)
    .sort((a, b) => b.percent - a.percent)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Budgets</h2>
      </div>

      {alerts.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, border: alerts.some(a => a.percent >= 100) ? '1px solid #ef4444' : '1px solid #f59e0b', background: alerts.some(a => a.percent >= 100) ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: alerts.some(a => a.percent >= 100) ? '#b91c1c' : '#92400e' }}>
              {alerts.some(a => a.percent >= 100) ? 'Over budget' : 'Nearing budget'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {alerts.slice(0, 5).map(a => (
                <span key={a.id} style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(148,163,184,0.15)', fontSize: 12 }}>
                  {a.category}: {a.percent}% used{a.percent >= 100 ? '' : `, $${a.remaining.toFixed(2)} left`}
                </span>
              ))}
              {alerts.length > 5 && (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>+{alerts.length - 5} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <form onSubmit={saveBudget} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12 }}>
          <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required style={inputStyle} />
          <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} style={inputStyle}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
          <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required style={inputStyle} />
          <button className="btn" type="submit">Save</button>
        </form>
      </div>

      {loading ? (
        <div className="muted">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="muted">No budgets yet</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Period</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Spent</th>
                  <th style={thStyle}>Remaining</th>
                  <th style={thStyle}>Progress</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <td style={tdStyle}>{b.category}</td>
                    <td style={tdStyle}>{b.period}</td>
                    <td style={tdStyleRight}>${b.amount.toFixed(2)}</td>
                    <td style={tdStyleRight}>${(b.spent || 0).toFixed(2)}</td>
                    <td style={tdStyleRight}>${(b.remaining || 0).toFixed(2)}</td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width="38" height="38" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                          <circle
                            cx="18" cy="18" r="16" fill="none"
                            stroke={progressColor(percent(b.spent, b.amount))}
                            strokeWidth="4"
                            strokeDasharray={`${Math.round(2 * Math.PI * 16 * (percent(b.spent, b.amount) / 100))} ${Math.round(2 * Math.PI * 16)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 18 18)"
                          />
                        </svg>
                        <div style={{ fontSize: 12, color: progressColor(percent(b.spent, b.amount)), fontWeight: 600 }}>{percent(b.spent, b.amount)}%</div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => deleteBudget(b._id)} style={{ padding: '6px 10px', border: '1px solid rgba(148,163,184,0.3)', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = { padding: 10, border: '1px solid rgba(148,163,184,0.3)', borderRadius: 8, background: 'var(--panel)', color: 'var(--text)' }
const thStyle = { padding: 12, textAlign: 'left', fontWeight: 600 }
const tdStyle = { padding: 12 }
const tdStyleRight = { padding: 12, textAlign: 'right' }



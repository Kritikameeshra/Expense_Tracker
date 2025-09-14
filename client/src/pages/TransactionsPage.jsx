import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import TransactionModal from '../components/TransactionModal'

const categoryIcons = {
  Food: '🍔', Transport: '🚕', Travel: '🚕', Shopping: '🛍️', Entertainment: '🎮', Bills: '🧾', Rent: '🏠', Healthcare: '🩺', Education: '🎓', Other: '📦',
  Salary: '💼', Freelance: '🧑‍💻', Investment: '📈', Gift: '🎁'
}

const paymentModes = ['cash', 'card', 'bank', 'wallet']

export default function TransactionsPage() {
  const [filters, setFilters] = useState({ category: '', from: '', to: '', paymentMethod: '', type: '' })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      // Use test endpoint to get all transactions without authentication
      const res = await axios.get('http://localhost:5000/api/stats/test/transactions', { 
        params: { 
          limit: 1000, // Large limit to get all transactions
          ...filters 
        } 
      })
      setTransactions(res.data.transactions || [])
    } catch (e) {
      console.error('Load transactions error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const applyFilters = (e) => { e.preventDefault(); fetchData() }

  const openAdd = () => { setEditing(null); setModalOpen(true) }

  const formatCurrency = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount)
  const formatDate = (date) => new Date(date).toLocaleDateString()

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Transactions</h2>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <form onSubmit={applyFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 10 }}>
          <select value={filters.type} onChange={e => onFilterChange('type', e.target.value)} style={inputStyle}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input placeholder="Category" value={filters.category} onChange={e => onFilterChange('category', e.target.value)} style={inputStyle} />
          <select value={filters.paymentMethod} onChange={e => onFilterChange('paymentMethod', e.target.value)} style={inputStyle}>
            <option value="">Payment Mode</option>
            {paymentModes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => onFilterChange('from', e.target.value)} style={inputStyle} />
          <input type="date" value={filters.to} onChange={e => onFilterChange('to', e.target.value)} style={inputStyle} />
          <button className="btn" type="submit">Apply</button>
        </form>
      </div>

      {loading ? (
        <div className="muted">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="muted">No transactions found</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Showing {transactions.length} transactions</span>
              <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span style={{ color: '#16a34a' }}>
                  Income: {transactions.filter(t => t.type === 'income').length}
                </span>
                <span style={{ color: '#ef4444' }}>
                  Expense: {transactions.filter(t => t.type === 'expense').length}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid' }}>
            {transactions.map(t => (
              <div key={t._id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 12, padding: 12, borderBottom: '1px solid #eef2f7' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', background: t.type === 'income' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  <span style={{ fontSize: 20 }}>{categoryIcons[t.category] || (t.type === 'income' ? '💵' : '💸')}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{t.category}</div>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#334155' }}>{t.paymentMethod || 'cash'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{t.description || '-'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: t.type === 'income' ? '#16a34a' : '#ef4444' }}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{formatDate(t.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={openAdd} className="btn" style={{ position: 'fixed', right: 20, bottom: 80, width: 56, height: 56, borderRadius: 999, display: 'grid', placeItems: 'center', padding: 0, fontSize: 26 }}>+</button>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} transaction={editing} onSave={fetchData} />
    </div>
  )
}

const inputStyle = { padding: 10, border: '1px solid rgba(148,163,184,0.3)', borderRadius: 8, background: 'var(--panel)', color: 'var(--text)' }



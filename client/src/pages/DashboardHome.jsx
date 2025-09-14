import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import TransactionModal from '../components/TransactionModal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'

const colors = ['#ec4899', '#a855f7', '#f472b6', '#c084fc', '#e879f9', '#a78bfa', '#fbbf24']

export default function DashboardHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ totals: { income: 0, expense: 0, balance: 0 }, monthly: [], categories: [] })
  const [recent, setRecent] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [days, setDays] = useState(30)
  const [trends, setTrends] = useState({ daily: [], topCategories: [] })
  const [trendsLoading, setTrendsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const [statsRes, recentRes, trendsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/stats/test'),
          axios.get('http://localhost:5000/api/stats/test/transactions', { params: { limit: 20 } }),
          axios.get('http://localhost:5000/api/stats/test/trends', { params: { days } }),
        ])
        if (mounted) {
          setStats(statsRes.data)
          setRecent(recentRes.data.transactions || [])
          setTrends({ daily: trendsRes.data.daily || [], topCategories: trendsRes.data.topCategories || [] })
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [days])

  const monthlyData = useMemo(() => {
    // Combine income/expense into per-month rows
    const map = new Map()
    for (const row of stats.monthly) {
      const key = `${row._id.y}-${row._id.m}`
      const existing = map.get(key) || { label: `${row._id.m}/${row._id.y}`, income: 0, expense: 0 }
      existing[row._id.type] = row.total
      map.set(key, existing)
    }
    return Array.from(map.values())
  }, [stats.monthly])

  const pieData = useMemo(() => {
    // Only expense categories for pie; fallback to income if no expense present
    const expenseCats = stats.categories.filter(c => c._id.type === 'expense').map(c => ({ name: c._id.category, value: c.total }))
    if (expenseCats.length > 0) return expenseCats
    return stats.categories.map(c => ({ name: `${c._id.type}:${c._id.category}`, value: c.total }))
  }, [stats.categories])

  const refreshData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const [statsRes, recentRes, trendsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/stats/test'),
        axios.get('http://localhost:5000/api/stats/test/transactions', { params: { limit: 20 } }),
        axios.get('http://localhost:5000/api/stats/test/trends', { params: { days } })
      ])
      setStats(statsRes.data)
      setRecent(recentRes.data.transactions || [])
      setTrends({ daily: trendsRes.data.daily || [], topCategories: trendsRes.data.topCategories || [] })
    } catch {}
  }

  const handleQuickAdd = (type) => {
    setEditing({ type, amount: '', category: '', description: '', date: new Date() })
    setModalOpen(true)
  }

  const formatCurrency = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount)
  const formatDate = (date) => new Date(date).toLocaleDateString()

  // KPIs for current month
  const now = new Date()
  const currentMonthIncome = useMemo(() => {
    const row = stats.monthly.find(r => r._id?.y === now.getFullYear() && r._id?.m === (now.getMonth() + 1) && r._id?.type === 'income')
    return row?.total || 0
  }, [stats.monthly])
  const currentMonthExpense = useMemo(() => {
    const row = stats.monthly.find(r => r._id?.y === now.getFullYear() && r._id?.m === (now.getMonth() + 1) && r._id?.type === 'expense')
    return row?.total || 0
  }, [stats.monthly])
  const currentMonthSavings = useMemo(() => currentMonthIncome - currentMonthExpense, [currentMonthIncome, currentMonthExpense])

  // Transform trends daily into chart data
  const lineData = useMemo(() => {
    // Build a continuous date series for the selected window
    const end = new Date(); end.setHours(0,0,0,0)
    const start = new Date(end); start.setDate(end.getDate() - (days - 1))
    const map = new Map()
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const label = d.toLocaleDateString()
      map.set(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`, { label, income: 0, expense: 0 })
    }
    for (const row of trends.daily) {
      const key = `${row._id.y}-${row._id.m}-${row._id.d}`
      const existing = map.get(key)
      if (existing) {
        existing[row._id.type] = row.total
      }
    }
    return Array.from(map.values())
  }, [trends.daily, days])

  const exportCSV = () => {
    const header = ['Date', 'Type', 'Category', 'Description', 'Amount']
    const rows = recent.map(t => [new Date(t.date).toISOString().split('T')[0], t.type, t.category, (t.description || '').replace(/\n|\r|\t/g, ' '), t.amount])
    const csv = [header, ...rows].map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    // Simple CSV with .xls extension opens in Excel
    const header = ['Date', 'Type', 'Category', 'Description', 'Amount']
    const rows = recent.map(t => [new Date(t.date).toISOString().split('T')[0], t.type, t.category, (t.description || '').replace(/\n|\r|\t/g, ' '), t.amount])
    const csv = [header, ...rows].map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.xls'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    // Create printable HTML and open print dialog; user can save as PDF
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Transactions</title>
    <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f1f5f9}</style>
    </head><body><h3>Recent Transactions</h3>
    <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>
    ${recent.map(t => `<tr><td>${new Date(t.date).toLocaleDateString()}</td><td>${t.type}</td><td>${t.category}</td><td>${(t.description||'').replace(/</g,'&lt;')}</td><td style="text-align:right">${t.amount}</td></tr>`).join('')}
    </tbody></table></body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: '#b91c1c' }}>{error}</p>

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      {/* Top Section: Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard title="Total Balance" value={stats.totals.balance} color="#a855f7" />
        <StatCard title="Total Income" value={stats.totals.income} color="#ec4899" />
        <StatCard title="Total Expense" value={stats.totals.expense} color="#f472b6" />
        <StatCard title={`Savings (${now.toLocaleString(undefined,{month:'short'})})`} value={currentMonthSavings} color="#c084fc" />
      </div>

      {/* Financial Overview Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Balance Breakdown Pie Chart */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>Financial Overview</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  dataKey="value" 
                  data={[
                    { name: 'Income', value: stats.totals.income, color: '#ec4899' },
                    { name: 'Expenses', value: stats.totals.expense, color: '#f472b6' },
                    { name: 'Balance', value: Math.max(0, stats.totals.balance), color: '#a855f7' }
                  ]} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {[
                    { name: 'Income', value: stats.totals.income, color: '#ec4899' },
                    { name: 'Expenses', value: stats.totals.expense, color: '#f472b6' },
                    { name: 'Balance', value: Math.max(0, stats.totals.balance), color: '#a855f7' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), name]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ color: '#374151', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>Income vs Expenses</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={[
                { name: 'Total Income', amount: stats.totals.income, color: '#ec4899' },
                { name: 'Total Expenses', amount: stats.totals.expense, color: '#f472b6' },
                { name: 'Net Balance', amount: stats.totals.balance, color: stats.totals.balance >= 0 ? '#a855f7' : '#fbbf24' }
              ]}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), name]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 0, 0]}
                  fill={(entry) => entry.color}
                >
                  {[
                    { name: 'Total Income', amount: stats.totals.income, color: '#ec4899' },
                    { name: 'Total Expenses', amount: stats.totals.expense, color: '#f472b6' },
                    { name: 'Net Balance', amount: stats.totals.balance, color: stats.totals.balance >= 0 ? '#a855f7' : '#fbbf24' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Middle Section: Category Pie and Monthly Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>Expense Categories</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  dataKey="value" 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={110} 
                  innerRadius={30}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), name]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ color: '#374151', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>Monthly Trends (Last 12 months)</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), name]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: '#374151', fontSize: 12 }}>{value}</span>}
                />
                <Bar dataKey="income" fill="#ec4899" name="Income" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#f472b6" name="Expense" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginTop: 16, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>Daily Trends</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7,30,90].map(d => (
              <button 
                key={d} 
                onClick={() => setDays(d)} 
                className="btn" 
                style={{ 
                  background: days === d ? '#2563eb' : '#f3f4f6', 
                  color: days === d ? '#fff' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={lineData}>
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value), name]}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                formatter={(value) => <span style={{ color: '#374151', fontSize: 12 }}>{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#ec4899" 
                strokeWidth={3}
                name="Income" 
                dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ec4899', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#f472b6" 
                strokeWidth={3}
                name="Expense" 
                dot={{ fill: '#f472b6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f472b6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions List */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Recent Transactions ({recent.length} total)</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={exportCSV}>Export CSV</button>
            <button className="btn" onClick={exportExcel}>Export Excel</button>
            <button className="btn" onClick={exportPDF}>Export PDF</button>
          </div>
        </div>
        {recent.length === 0 ? (
          <div style={{ color: '#64748b' }}>No recent transactions</div>
        ) : (
          <div style={{ display: 'grid', gap: 8, maxHeight: '400px', overflowY: 'auto' }}>
            {recent.map((t) => (
              <div key={t._id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 12, padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', background: t.type === 'income' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)', color: t.type === 'income' ? '#16a34a' : '#ef4444', fontSize: 18 }}>
                  {t.type === 'income' ? '⬆️' : '⬇️'}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{t.category}</div>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#334155' }}>{t.type}</span>
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
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editing}
        onSave={refreshData}
      />
    </div>
  )
}

function StatCard({ title, value, color }) {
  return (
    <div style={{ 
      background: '#fff', 
      border: '1px solid #e5e7eb', 
      borderRadius: 16, 
      padding: 20, 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <div style={{ 
        fontSize: 32, 
        fontWeight: 700, 
        color,
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
      }}>
        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)}
      </div>
    </div>
  )
}




import { Link, NavLink, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  function handleLogout() {
    logout()
    navigate('/auth')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside style={{ 
        padding: 18, 
        borderRight: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, minHeight: 80 }}>
          <img src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user?.name || 'User')} alt="avatar" width={48} height={48} style={{ borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, wordBreak: 'break-word' }}>{user?.name || 'User'}</div>
            <div className="muted" style={{ fontSize: 11, wordBreak: 'break-all', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{user?.email}</div>
          </div>
        </div>
        <nav className="card" style={{ padding: 10, display: 'grid', gap: 6 }}>
          <NavItem to="/" label="Dashboard" icon="space_dashboard" />
          <NavItem to="/transactions" label="Transactions" icon="receipt_long" />
          <NavItem to="/budgets" label="Budgets" icon="account_balance_wallet" />
          <NavItem to="/insights" label="Insights" icon="query_stats" />
          <NavItem to="/connections" label="Settings" icon="settings" />
          <button onClick={handleLogout} style={{ ...navButtonStyle }}>
            <span className="material-icons-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 8 }}>logout</span>
            Logout
          </button>
        </nav>
      </aside>
      <main>
        <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '16px 18px', 
          gap: 12,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)'
        }}>
          <Link to="/" className="brand" style={{ textDecoration: 'none', fontSize: 18 }}>Expense Tracker</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
            <input
              placeholder="Search transactions..."
              defaultValue={searchParams.get('search') || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = e.currentTarget.value
                  navigate(`/transactions?search=${encodeURIComponent(q)}`)
                }
              }}
              style={{ 
                padding: 12, 
                border: '1px solid var(--border)', 
                borderRadius: 16, 
                minWidth: 240,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(5px)',
                fontSize: 14
              }}
            />
            <button
              className="btn outline"
              onClick={() => {
                const html = document.documentElement
                const isDark = html.getAttribute('data-theme') === 'dark'
                html.setAttribute('data-theme', isDark ? 'light' : 'dark')
              }}
            >
              <span className="material-icons-outlined" style={{ fontSize: 18 }}>dark_mode</span>
              Theme
            </button>
            <button className="btn" onClick={() => window.location.href = '/income'}>Add Transaction</button>
          </div>
        </header>
        <div style={{ padding: 18 }}>
          <Outlet />
        </div>
      </main>
      {/* Mobile Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--panel)', borderTop: '1px solid var(--border)', display: 'none', gridTemplateColumns: 'repeat(5,1fr)', padding: 6 }} className="mobile-nav">
        <BottomItem to="/" icon="space_dashboard" label="Home" />
        <BottomItem to="/transactions" icon="receipt_long" label="Trans" />
        <BottomItem to="/budgets" icon="account_balance_wallet" label="Budgets" />
        <BottomItem to="/insights" icon="query_stats" label="Insights" />
        <BottomItem to="/connections" icon="settings" label="Settings" />
      </nav>
    </div>
  )
}

function NavItem({ to, label, icon }) {
  return (
    <NavLink to={to} end style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
      color: isActive ? '#111827' : '#334155', background: isActive ? '#e2e8f0' : 'transparent'
    })}>
      <span className="material-icons-outlined" style={{ fontSize: 20 }}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

function BottomItem({ to, icon, label }) {
  return (
    <NavLink to={to} end style={({ isActive }) => ({ display: 'grid', placeItems: 'center', padding: 6, color: isActive ? '#111827' : '#64748b', textDecoration: 'none' })}>
      <span className="material-icons-outlined" style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11 }}>{label}</span>
    </NavLink>
  )
}

const navButtonStyle = { textAlign: 'left', padding: '10px 12px', borderRadius: 8, background: 'transparent', color: '#334155', border: '1px solid #e2e8f0', cursor: 'pointer' }



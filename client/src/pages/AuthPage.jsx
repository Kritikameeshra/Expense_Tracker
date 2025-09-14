import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const form = new FormData()
        form.append('name', name)
        form.append('email', email)
        form.append('password', password)
        if (avatar) form.append('avatar', avatar)
        await signup(form)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: 420, padding: 26 }}>
        <h2 style={{ margin: 0, marginBottom: 8, textAlign: 'center' }}>
          <span className="brand">Expense</span> Tracker
        </h2>
        <p className="muted" style={{ marginTop: 0, textAlign: 'center' }}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</p>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          {mode === 'signup' && (
            <>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Name</span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Profile picture</span>
                <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files?.[0] || null)} />
              </label>
            </>
          )}
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </label>
          <button disabled={loading} className="btn" style={{ justifyContent: 'center' }}>{loading ? 'Please wait...' : (mode === 'signup' ? 'Create account' : 'Sign in')}</button>
        </form>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          {mode === 'signup' ? (
            <button onClick={() => setMode('signin')} style={linkStyle}>Already have an account? Sign in</button>
          ) : (
            <button onClick={() => setMode('signup')} style={linkStyle}>New here? Create an account</button>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e4e7ec', outline: 'none' }
const buttonStyle = { padding: '10px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }
const linkStyle = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' }



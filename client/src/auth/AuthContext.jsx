import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  useEffect(() => {
    axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : ''
  }, [token])

  const api = useMemo(
    () => ({
      async signup(formData) {
        const res = await axios.post('/api/auth/signup', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setToken(res.data.token)
        setUser(res.data.user)
      },
      async login(email, password) {
        const res = await axios.post('/api/auth/login', { email, password })
        setToken(res.data.token)
        setUser(res.data.user)
      },
      async fetchMe() {
        const res = await axios.get('/api/auth/me')
        setUser(res.data.user)
      },
      logout() {
        setToken('')
        setUser(null)
      }
    }),
    []
  )

  const value = useMemo(() => ({ token, user, ...api }), [token, user, api])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}



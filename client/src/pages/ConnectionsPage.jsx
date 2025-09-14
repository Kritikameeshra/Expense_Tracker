import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ConnectionsPage() {
  const [bankAccounts, setBankAccounts] = useState([])
  const [digitalWallets, setDigitalWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('banks')

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      
      const [bankRes, walletRes] = await Promise.all([
        axios.get('http://localhost:5000/api/bank-accounts', { headers }),
        axios.get('http://localhost:5000/api/digital-wallets', { headers })
      ])
      
      setBankAccounts(bankRes.data.accounts || [])
      setDigitalWallets(walletRes.data.wallets || [])
    } catch (e) {
      console.error('Load connections error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Connections</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className={activeTab === 'banks' ? 'btn' : ''} 
            onClick={() => setActiveTab('banks')}
            style={{ padding: '8px 16px', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 8, background: activeTab === 'banks' ? 'var(--accent)' : 'transparent', color: activeTab === 'banks' ? 'white' : 'var(--text)' }}
          >
            Bank Accounts
          </button>
          <button 
            className={activeTab === 'wallets' ? 'btn' : ''} 
            onClick={() => setActiveTab('wallets')}
            style={{ padding: '8px 16px', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 8, background: activeTab === 'wallets' ? 'var(--accent)' : 'transparent', color: activeTab === 'wallets' ? 'white' : 'var(--text)' }}
          >
            Digital Wallets
          </button>
        </div>
      </div>

      {loading ? (
        <div className="muted">Loading connections...</div>
      ) : (
        <>
          {activeTab === 'banks' && (
            <div>
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Bank Accounts</h3>
                <p className="muted">Connect your bank accounts to automatically sync transactions and track balances.</p>
                <button className="btn">+ Add Bank Account</button>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <div className="muted">No bank accounts connected</div>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Bank</th>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Account Type</th>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Account Number</th>
                          <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>Balance</th>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Last Sync</th>
                          <th style={{ padding: 16, textAlign: 'center', fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankAccounts.map((account) => (
                          <tr key={account._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                            <td style={{ padding: 16 }}>{account.bankName}</td>
                            <td style={{ padding: 16 }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: 'rgba(99,102,241,0.2)',
                                color: 'var(--accent)',
                                fontSize: 12,
                                fontWeight: 500
                              }}>
                                {account.accountType}
                              </span>
                            </td>
                            <td style={{ padding: 16 }}>****{account.accountNumber}</td>
                            <td style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(account.balance, account.currency)}
                            </td>
                            <td style={{ padding: 16, color: 'var(--muted)' }}>
                              {account.lastSync ? formatDate(account.lastSync) : 'Never'}
                            </td>
                            <td style={{ padding: 16, textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button className="btn" style={{ padding: '6px 12px', fontSize: 12 }}>Sync</button>
                                <button style={{ padding: '6px 12px', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 6, background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wallets' && (
            <div>
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Digital Wallets</h3>
                <p className="muted">Connect your digital wallets like PayPal, Google Pay, UPI, and more.</p>
                <button className="btn">+ Add Digital Wallet</button>
              </div>

              {digitalWallets.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <div className="muted">No digital wallets connected</div>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Wallet</th>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Type</th>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>ID</th>
                          <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>Balance</th>
                          <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Last Sync</th>
                          <th style={{ padding: 16, textAlign: 'center', fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {digitalWallets.map((wallet) => (
                          <tr key={wallet._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                            <td style={{ padding: 16 }}>{wallet.walletName}</td>
                            <td style={{ padding: 16 }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: 'rgba(34,211,238,0.2)',
                                color: 'var(--accent-2)',
                                fontSize: 12,
                                fontWeight: 500
                              }}>
                                {wallet.walletType.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: 16 }}>{wallet.walletId}</td>
                            <td style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(wallet.balance, wallet.currency)}
                            </td>
                            <td style={{ padding: 16, color: 'var(--muted)' }}>
                              {wallet.lastSync ? formatDate(wallet.lastSync) : 'Never'}
                            </td>
                            <td style={{ padding: 16, textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button className="btn" style={{ padding: '6px 12px', fontSize: 12 }}>Sync</button>
                                <button style={{ padding: '6px 12px', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 6, background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

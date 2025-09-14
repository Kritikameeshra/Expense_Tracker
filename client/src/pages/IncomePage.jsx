import { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionModal from '../components/TransactionModal';

export default function IncomePage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/stats/transactions', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        params: { type: 'income', page, search }
      });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Fetch transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, search]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/stats/transactions/${id}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      fetchTransactions();
    } catch (error) {
      console.error('Delete transaction error:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    fetchTransactions();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Income</h2>
        <button onClick={handleAddNew} className="btn">
          + Add Income
        </button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: 10,
              border: '1px solid rgba(148,163,184,0.3)',
              borderRadius: 8,
              background: 'var(--panel)',
              color: 'var(--text)'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="muted">Loading transactions...</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div className="muted" style={{ marginBottom: 16 }}>No income transactions found</div>
          <button onClick={handleAddNew} className="btn">Add your first income</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: 16, textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <td style={{ padding: 16 }}>{formatDate(transaction.date)}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'rgba(34,211,238,0.2)',
                        color: 'var(--accent-2)',
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {transaction.category}
                      </span>
                    </td>
                    <td style={{ padding: 16, color: 'var(--muted)' }}>
                      {transaction.description || '-'}
                    </td>
                    <td style={{ padding: 16, textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                      +{formatCurrency(transaction.amount)}
                    </td>
                    <td style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(transaction)}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid rgba(148,163,184,0.3)',
                            borderRadius: 6,
                            background: 'transparent',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 6,
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ padding: 16, borderTop: '1px solid rgba(148,163,184,0.2)', display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn"
                style={{ padding: '8px 12px' }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 12px', color: 'var(--muted)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn"
                style={{ padding: '8px 12px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editingTransaction}
        onSave={handleSave}
      />
    </div>
  );
}
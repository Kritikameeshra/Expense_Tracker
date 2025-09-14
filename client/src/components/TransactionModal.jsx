import { useState, useEffect } from 'react';
import axios from 'axios';

const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other']
};

const paymentMethods = ['cash', 'card', 'bank', 'wallet'];

export default function TransactionModal({ isOpen, onClose, transaction, onSave }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        description: transaction.description || '',
        paymentMethod: transaction.paymentMethod || 'cash',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [transaction, isOpen]);

  // Auto-categorize when description changes
  useEffect(() => {
    if (formData.description && formData.description.length > 3) {
      const autoCategorize = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post('http://localhost:5000/api/ml/categorize', 
            { description: formData.description },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSuggestedCategory(response.data.category);
        } catch (error) {
          console.error('Auto-categorize error:', error);
        }
      };
      
      const timeoutId = setTimeout(autoCategorize, 500); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestedCategory('');
    }
  }, [formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = transaction 
        ? `http://localhost:5000/api/stats/transactions/${transaction._id}`
        : 'http://localhost:5000/api/stats/transactions';
      
      const method = transaction ? 'PUT' : 'POST';
      
      await axios({
        method,
        url,
        data: formData,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Save transaction error:', error);
      alert('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ width: 480, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>{transaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid rgba(148,163,184,0.3)',
                  borderRadius: 8,
                  background: 'var(--panel)',
                  color: 'var(--text)'
                }}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid rgba(148,163,184,0.3)',
                  borderRadius: 8,
                  background: 'var(--panel)',
                  color: 'var(--text)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: 8,
                background: 'var(--panel)',
                color: 'var(--text)'
              }}
            >
              <option value="">Select category</option>
              {categories[formData.type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {suggestedCategory && suggestedCategory !== formData.category && (
              <div style={{ marginTop: 8, padding: 8, background: 'rgba(34,211,238,0.1)', borderRadius: 6, border: '1px solid rgba(34,211,238,0.3)' }}>
                <div style={{ fontSize: 12, color: 'var(--accent-2)', marginBottom: 4 }}>🤖 AI Suggestion</div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: suggestedCategory })}
                  style={{
                    padding: '4px 8px',
                    background: 'var(--accent-2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Use "{suggestedCategory}"
                </button>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: 8,
                background: 'var(--panel)',
                color: 'var(--text)'
              }}
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method.charAt(0).toUpperCase() + method.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: 8,
                background: 'var(--panel)',
                color: 'var(--text)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: 8,
                background: 'var(--panel)',
                color: 'var(--text)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: 12,
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: 8,
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {loading ? 'Saving...' : (transaction ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

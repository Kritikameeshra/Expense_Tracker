import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardLayout from './layout/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import IncomePage from './pages/IncomePage'
import ExpensePage from './pages/ExpensePage'
import BudgetsPage from './pages/BudgetsPage'
import ConnectionsPage from './pages/ConnectionsPage'
import MLInsightsPage from './pages/MLInsightsPage'
import TransactionsPage from './pages/TransactionsPage'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="income" element={<IncomePage />} />
          <Route path="expense" element={<ExpensePage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="insights" element={<MLInsightsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}



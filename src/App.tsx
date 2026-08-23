import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { MainLayout } from './components/layout/MainLayout'
import { DailyReport } from './pages/DailyReport'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { OperationTypes } from './pages/OperationTypes'
import { Operations } from './pages/Operations'
import { PeriodReport } from './pages/PeriodReport'
import { Register } from './pages/Register'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route
              path="operations"
              element={
                <ProtectedRoute>
                  <Operations />
                </ProtectedRoute>
              }
            />
            <Route
              path="operation-types"
              element={
                <ProtectedRoute>
                  <OperationTypes />
                </ProtectedRoute>
              }
            />
            <Route
              path="daily-report"
              element={
                <ProtectedRoute>
                  <DailyReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="period-report"
              element={
                <ProtectedRoute>
                  <PeriodReport />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

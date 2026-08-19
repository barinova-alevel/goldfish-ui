import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { DailyReport } from './pages/DailyReport'
import { Home } from './pages/Home'
import { OperationTypes } from './pages/OperationTypes'
import { Operations } from './pages/Operations'
import { PeriodReport } from './pages/PeriodReport'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="operations" element={<Operations />} />
          <Route path="operation-types" element={<OperationTypes />} />
          <Route path="daily-report" element={<DailyReport />} />
          <Route path="period-report" element={<PeriodReport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

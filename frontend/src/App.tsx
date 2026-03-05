import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import WorkerHome from './pages/WorkerHome'
import TaskList from './pages/TaskList'
import EmployeeHome from './pages/EmployeeHome'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/worker" element={<WorkerHome />} />
        <Route path="/worker/tasks" element={<TaskList />} />
        <Route path="/employee" element={<EmployeeHome />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

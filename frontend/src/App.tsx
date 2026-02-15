import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import './styles/App.css'

function AppContent() {
  const { currentUser } = useApp()
  const [dbInitialized, setDbInitialized] = useState(false)

  useEffect(() => {
    setDbInitialized(true)
  }, [])

  if (!dbInitialized) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={currentUser ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  )
}

export default App

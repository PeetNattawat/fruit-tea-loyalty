import React from 'react'
import { Routes, Route } from 'react-router-dom'
import CustomerPage from './components/CustomerPage'
import AdminDashboard from './components/AdminDashboard'

function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  )
}

export default App

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Search,
  Users,
  Gift,
  Star,
  History,
  Lock,
  LogOut,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  Droplets,
  QrCode,
  RefreshCw,
  Plus,
  Trash2,
  Database
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api'

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState('customers')

  // Customers state
  const [customers, setCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState({ points: 0, total_collected: 0 })

  // History state
  const [history, setHistory] = useState([])
  const [historyFilter, setHistoryFilter] = useState('')
  
  // QR Code state
  const [qrCode, setQrCode] = useState('')

  // Add customer modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerPoints, setNewCustomerPoints] = useState(0)

  // Database storage state
  const [storageInfo, setStorageInfo] = useState(null)

  // Check if already logged in
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  // Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')

    try {
      const response = await axios.post(`${API_URL}/admin/login`, { password })
      if (response.data.success) {
        sessionStorage.setItem('admin_token', response.data.token)
        setIsLoggedIn(true)
        setPassword('')
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login failed')
    }
  }

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    setIsLoggedIn(false)
  }

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/admin/customers?search=${searchQuery}`)
      setCustomers(response.data.customers || [])
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch history
  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/history?phone=${historyFilter}`)
      setHistory(response.data.history || [])
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch QR Code
  const fetchQrCode = async () => {
    try {
      const response = await axios.get(`${API_URL}/qr-code`)
      setQrCode(response.data.qrCode)
    } catch (err) {
      console.error('Failed to fetch QR code:', err)
    }
  }

  // Fetch database storage info
  const fetchStorageInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/storage`)
      setStorageInfo(response.data)
    } catch (err) {
      console.error('Failed to fetch storage info:', err)
    }
  }

  // Add new customer
  const addCustomer = async () => {
    if (!newCustomerPhone || newCustomerPhone.length < 10) {
      alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 ตัว)')
      return
    }
    
    setLoading(true)
    try {
      await axios.post(`${API_URL}/admin/customers`, {
        phone_number: newCustomerPhone,
        points: parseInt(newCustomerPoints) || 0
      })
      setShowAddModal(false)
      setNewCustomerPhone('')
      setNewCustomerPoints(0)
      fetchCustomers()
      fetchHistory()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add customer')
    } finally {
      setLoading(false)
    }
  }

  // Delete customer
  const deleteCustomer = async (phone) => {
    if (!confirm(`ต้องการลบลูกค้า ${phone} ใช่หรือไม่?`)) {
      return
    }
    
    setLoading(true)
    try {
      await axios.delete(`${API_URL}/admin/customers/${phone}`)
      fetchCustomers()
      fetchHistory()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete customer')
    } finally {
      setLoading(false)
    }
  }

  // Refresh all data
  const refreshData = async () => {
    setLoading(true)
    await Promise.all([
      fetchCustomers(),
      fetchHistory(),
      fetchQrCode(),
      fetchStorageInfo()
    ])
    setLoading(false)
  }

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchCustomers()
      fetchHistory()
      fetchQrCode()
      fetchStorageInfo()
    }
  }, [isLoggedIn])

  // Search customers
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoggedIn) {
        fetchCustomers()
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  // Start editing customer
  const startEdit = (customer) => {
    setEditingCustomer(customer.phone_number)
    setEditForm({
      points: customer.points,
      total_collected: customer.total_collected
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingCustomer(null)
    setEditForm({ points: 0, total_collected: 0 })
  }

  // Save customer edit
  const saveEdit = async (phone) => {
    try {
      await axios.patch(`${API_URL}/admin/customers/${phone}`, editForm)
      fetchCustomers()
      setEditingCustomer(null)
    } catch (err) {
      console.error('Failed to update customer:', err)
    }
  }

  // Manual redeem
  const manualRedeem = async (phone) => {
    if (!confirm(`Are you sure you want to manually redeem points for ${phone}?`)) {
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/admin/redeem`, { phone_number: phone })
      fetchCustomers()
      fetchHistory()
    } catch (err) {
      console.error('Failed to redeem:', err)
    } finally {
      setLoading(false)
    }
  }

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-red via-deep-red to-deep-red-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="glass rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-fruit-orange to-lemon-yellow rounded-full mb-4 shadow-xl">
                <Droplets className="w-10 h-10 text-deep-red" />
              </div>
              <h1 className="text-3xl font-bold text-tea-brown font-display mb-2">YANGCHAM</h1>
              <p className="text-tea-brown/70 text-lg font-display">ชาอย่างฉ่ำ - Admin</p>
              <p className="text-tea-brown/50 mt-2">กรอกรหัสผ่านเพื่อเข้าสู่ระบบ</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  className="w-full px-4 py-3 border-2 border-fruit-orange/30 rounded-2xl focus:border-fruit-orange focus:outline-none bg-cream/50 text-tea-brown font-display"
                />
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700 font-display">{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-fruit-orange to-fruit-orange-light text-white font-bold rounded-2xl btn-press transition-all font-display text-lg"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-red via-deep-red to-deep-red-dark">
      {/* Header */}
      <header className="bg-cream/95 backdrop-blur-sm shadow-lg border-b border-fruit-orange/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-fruit-orange to-lemon-yellow rounded-full flex items-center justify-center mr-3 shadow-lg">
                <Droplets className="w-6 h-6 text-deep-red" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-tea-brown font-display">YANGCHAM</h1>
                <p className="text-tea-brown/60 text-sm font-display">ชาอย่างฉ่ำ - Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center px-4 py-2 mr-2 text-tea-brown hover:text-fruit-orange transition-colors font-display disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-tea-brown hover:text-fruit-orange transition-colors font-display"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center px-4 py-2 rounded-2xl font-medium transition-all font-display ${
              activeTab === 'customers'
                ? 'bg-fruit-orange text-white shadow-lg'
                : 'bg-cream text-tea-brown hover:bg-fruit-orange/20'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            ลูกค้า
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center px-4 py-2 rounded-2xl font-medium transition-all font-display ${
              activeTab === 'history'
                ? 'bg-fruit-orange text-white shadow-lg'
                : 'bg-cream text-tea-brown hover:bg-fruit-orange/20'
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            ประวัติ
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center px-4 py-2 rounded-2xl font-medium transition-all font-display ${
              activeTab === 'qrcode'
                ? 'bg-fruit-orange text-white shadow-lg'
                : 'bg-cream text-tea-brown hover:bg-fruit-orange/20'
            }`}
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </button>
        </div>

        {/* Database Storage Monitor */}
        {storageInfo && (
          <div className="mb-6">
            <div className={`glass rounded-2xl p-4 shadow-lg ${storageInfo.usage_percent > 80 ? 'border-2 border-red-500' : storageInfo.usage_percent > 60 ? 'border-2 border-yellow-500' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-tea-brown" />
                  <span className="font-display font-medium text-tea-brown">พื้นที่ฐานข้อมูล</span>
                  {storageInfo.usage_percent > 80 && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-display">ใกล้เต็ม!</span>
                  )}
                </div>
                <span className="font-display text-sm text-tea-brown/70">
                  {storageInfo.used_mb} MB / {storageInfo.total_mb} MB
                </span>
              </div>
              <div className="w-full bg-cream-dark/50 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${storageInfo.usage_percent > 80 ? 'bg-red-500' : storageInfo.usage_percent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${storageInfo.usage_percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-tea-brown/60 font-display">
                {storageInfo.customers_count} ลูกค้า | {storageInfo.history_count} รายการประวัติ
              </p>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="glass rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-fruit-orange/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-tea-brown font-display">รายชื่อลูกค้า</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-fruit-orange text-white rounded-2xl hover:bg-fruit-orange-light transition-all font-display"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มลูกค้า
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tea-brown/40 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาเบอร์โทร..."
                      className="pl-10 pr-4 py-2 border border-fruit-orange/30 rounded-2xl focus:border-fruit-orange focus:outline-none bg-cream/50 text-tea-brown font-display"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-dark/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">เบอร์โทร</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">แต้ม</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">ฟรีที่ได้รับ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">วันที่สมัคร</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fruit-orange/10">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-fruit-orange" />
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-tea-brown/60 font-display">
                        ไม่พบข้อมูลลูกค้า
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-cream/30">
                        <td className="px-6 py-4 font-mono text-sm text-tea-brown">{customer.phone_number}</td>
                        <td className="px-6 py-4">
                          {editingCustomer === customer.phone_number ? (
                            <input
                              type="number"
                              value={editForm.points}
                              onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border border-fruit-orange/30 rounded-xl"
                              min="0"
                              max="10"
                            />
                          ) : (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-fruit-orange mr-1" />
                              <span className="font-medium text-tea-brown font-display">{customer.points}/10</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingCustomer === customer.phone_number ? (
                            <input
                              type="number"
                              value={editForm.total_collected}
                              onChange={(e) => setEditForm({ ...editForm, total_collected: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border border-fruit-orange/30 rounded-xl"
                              min="0"
                            />
                          ) : (
                            <div className="flex items-center">
                              <Gift className="w-4 h-4 text-fruit-orange mr-1" />
                              <span className="text-tea-brown font-display">{customer.total_collected}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-tea-brown/60 font-display">
                          {new Date(customer.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {editingCustomer === customer.phone_number ? (
                              <>
                                <button
                                  onClick={() => saveEdit(customer.phone_number)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded-xl"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded-xl"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(customer)}
                                  className="p-1 text-tea-brown hover:bg-cream-dark rounded-xl"
                                  title="แก้ไข"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteCustomer(customer.phone_number)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded-xl"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {customer.points >= 10 && (
                                  <button
                                    onClick={() => manualRedeem(customer.phone_number)}
                                    className="px-3 py-1 bg-fruit-orange text-white text-xs rounded-xl hover:bg-fruit-orange-light font-display"
                                  >
                                    แลกฟรี
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="glass rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-fruit-orange/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-tea-brown font-display">ประวัติการใช้งาน</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tea-brown/40 w-4 h-4" />
                  <input
                    type="text"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    onBlur={fetchHistory}
                    placeholder="กรองตามเบอร์โทร..."
                    className="pl-10 pr-4 py-2 border border-fruit-orange/30 rounded-2xl focus:border-fruit-orange focus:outline-none bg-cream/50 text-tea-brown font-display"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-dark/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">เบอร์โทร</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">ประเภท</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">แต้ม</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tea-brown/70 uppercase font-display">เวลา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fruit-orange/10">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-fruit-orange" />
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-tea-brown/60 font-display">
                        ไม่พบประวัติการใช้งาน
                      </td>
                    </tr>
                  ) : (
                    history.map((entry) => (
                      <tr key={entry.id} className="hover:bg-cream/30">
                        <td className="px-6 py-4 font-mono text-sm text-tea-brown">{entry.phone_number}</td>
                        <td className="px-6 py-4">
                          {entry.redeemed ? (
                            <span className="px-2 py-1 bg-fruit-orange/20 text-fruit-orange text-xs rounded-full font-display">
                              แลกฟรี
                            </span>
                          ) : entry.points_added > 0 ? (
                            <span className="px-2 py-1 bg-lemon-yellow/30 text-tea-brown text-xs rounded-full font-display">
                              สะสมแต้ม
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-cream-dark text-tea-brown/70 text-xs rounded-full font-display">
                              ปรับแต้ม
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-tea-brown font-display">
                          {entry.points_added > 0 ? `+${entry.points_added}` : entry.points_added}
                        </td>
                        <td className="px-6 py-4 text-sm text-tea-brown/60 font-display">
                          {new Date(entry.timestamp).toLocaleString('th-TH')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qrcode' && (
          <div className="glass rounded-3xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-tea-brown font-display mb-2">QR Code สำหรับลูกค้า</h2>
            <p className="text-tea-brown/60 mb-6 font-display">สแกนเพื่อเปิดหน้าสะสมแต้ม</p>
            
            {qrCode ? (
              <div className="inline-block p-4 bg-cream rounded-2xl shadow-xl">
                <img src={qrCode} alt="YANGCHAM Loyalty QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-fruit-orange" />
              </div>
            )}
            
            {/* Download Button */}
            {qrCode && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = qrCode
                    link.download = 'yangcham-qr-code.png'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="inline-flex items-center px-6 py-3 bg-fruit-orange hover:bg-fruit-orange-light text-white font-bold rounded-2xl btn-press transition-all font-display"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  โหลด QR Code (PNG)
                </button>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-cream-dark/50 rounded-2xl">
              <p className="text-tea-brown/70 text-sm font-display mb-2">คำแนะนำ:</p>
              <ul className="text-tea-brown/60 text-sm text-left space-y-1 font-display">
                <li>• ดาวน์โหลด QR Code นี้เพื่อพิมพ์</li>
                <li>• ติดไว้ที่เคาน์เตอร์ร้าน</li>
                <li>• ลูกค้าสแกนแล้วกรอกเบอร์โทรเพื่อสะสมแต้ม</li>
              </ul>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-tea-brown font-display mb-6">เพิ่มลูกค้าใหม่</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-tea-brown/70 mb-2 font-display">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="กรอกเบอร์ 10 ตัว"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-fruit-orange/30 rounded-2xl focus:border-fruit-orange focus:outline-none bg-cream/50 text-tea-brown font-display"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-tea-brown/70 mb-2 font-display">แต้มเริ่มต้น</label>
                  <input
                    type="number"
                    value={newCustomerPoints}
                    onChange={(e) => setNewCustomerPoints(e.target.value)}
                    min="0"
                    max="10"
                    className="w-full px-4 py-3 border border-fruit-orange/30 rounded-2xl focus:border-fruit-orange focus:outline-none bg-cream/50 text-tea-brown font-display"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-fruit-orange/30 text-tea-brown rounded-2xl hover:bg-cream-dark transition-all font-display"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={addCustomer}
                  disabled={loading}
                  className="flex-1 py-3 bg-fruit-orange text-white rounded-2xl hover:bg-fruit-orange-light transition-all font-display disabled:opacity-50"
                >
                  {loading ? 'กำลังเพิ่ม...' : 'เพิ่มลูกค้า'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

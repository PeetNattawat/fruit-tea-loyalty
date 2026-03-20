import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Phone, Star, Gift, CheckCircle, AlertCircle, Loader2, Droplets } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { LanguageToggle } from './LanguageToggle'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Generate unique token for anti-refresh abuse
const generateToken = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session token
const getSessionToken = () => {
  let token = sessionStorage.getItem('yangcham_token')
  if (!token) {
    token = generateToken()
    sessionStorage.setItem('yangcham_token', token)
  }
  return token
}

export default function CustomerPage() {
  const { t } = useLanguage()
  const [phone, setPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRedeemOptions, setShowRedeemOptions] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalCountdown, setModalCountdown] = useState(5)
  const [step, setStep] = useState('phone') // 'phone' | 'collect'
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemCountdown, setRedeemCountdown] = useState(5)

  // Handle phone input - only allow numbers
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15)
    setPhone(value)
    setError('')
  }

  // Go to collect step
  const handleContinue = async () => {
    if (!phone || phone.length < 10) {
      setError(t('invalidPhone'))
      return
    }
    
    setLoading(true)
    try {
      // Try to get existing customer
      const response = await axios.get(`${API_URL}/customer/${phone}`)
      const customerData = response.data.customer
      setCustomer(customerData)
      // If customer has 10 points, show redeem options immediately
      if (customerData.can_redeem) {
        setShowRedeemOptions(true)
      }
    } catch (err) {
      // New customer, will be created on first collect
      setCustomer(null)
      setShowRedeemOptions(false)
    } finally {
      setLoading(false)
      setStep('collect')
      setError('')
    }
  }

  // Logout / Go back to phone entry
  const handleLogout = () => {
    setStep('phone')
    setPhone('')
    setCustomer(null)
    setError('')
    setSuccess('')
    setShowRedeemOptions(false)
  }

  // Collect point
  const collectPoint = async () => {
    if (!phone || phone.length < 10) {
      setError(t('invalidPhone'))
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = getSessionToken()
      const response = await axios.post(`${API_URL}/collect-point`, {
        phone_number: phone,
        token
      })

      setCustomer(response.data.customer)
      
      // When reaching 10 points, show redeem options immediately
      if (response.data.customer.can_redeem) {
        setShowRedeemOptions(true)
      } else {
        // Show success modal for normal point collection
        setShowSuccessModal(true)
        setModalCountdown(5)
      }

    } catch (err) {
      if (err.response?.data?.customer?.can_redeem) {
        setCustomer(err.response.data.customer)
        // Show redeem options immediately when at 10 points
        setShowRedeemOptions(true)
      } else {
        setError(err.response?.data?.error || t('pleaseTryAgain'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Check customer status
  const checkCustomer = useCallback(async () => {
    if (!phone || phone.length < 10) return

    try {
      const response = await axios.get(`${API_URL}/customer/${phone}`)
      setCustomer(response.data.customer)
    } catch (err) {
      // Customer not found is OK, they will be created
    }
  }, [phone])

  // Check customer when phone changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (phone.length >= 10) {
        checkCustomer()
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [phone, checkCustomer])

  // Redeem free drink
  const redeemDrink = async () => {
    if (!phone) return

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/redeem`, {
        phone_number: phone
      })

      setCustomer(response.data.customer)
      setShowRedeemOptions(false)
      // Show redeem success modal
      setShowRedeemModal(true)
      setRedeemCountdown(5)

    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  // Save for later - close window
  const saveForLater = () => {
    window.close()
    // Fallback if window.close() doesn't work
    setTimeout(() => {
      window.location.href = 'about:blank'
    }, 500)
  }

  // Show redeem options when max points reached
  useEffect(() => {
    if (customer?.can_redeem) {
      setShowRedeemOptions(true)
    }
  }, [customer])

  // Countdown for success modal
  useEffect(() => {
    if (showSuccessModal && modalCountdown > 0) {
      const timer = setInterval(() => {
        setModalCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (showSuccessModal && modalCountdown === 0) {
      // Close window after countdown
      window.close()
      // Fallback: redirect to about:blank if window.close() doesn't work
      setTimeout(() => {
        window.location.href = 'about:blank'
      }, 500)
    }
  }, [showSuccessModal, modalCountdown])

  // Countdown for redeem modal
  useEffect(() => {
    if (showRedeemModal && redeemCountdown > 0) {
      const timer = setInterval(() => {
        setRedeemCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (showRedeemModal && redeemCountdown === 0) {
      // Close window after countdown
      window.close()
      // Fallback: redirect to about:blank if window.close() doesn't work
      setTimeout(() => {
        window.location.href = 'about:blank'
      }, 500)
    }
  }, [showRedeemModal, redeemCountdown])

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-red via-deep-red-dark to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-fruit-orange/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-20 right-20 w-40 h-40 bg-lemon-yellow/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-fruit-orange/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-10 right-10 w-36 h-36 bg-lemon-yellow/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-deep-red/80 via-deep-red-dark/90 to-black opacity-90" />
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Language Toggle */}
        <div className="absolute top-0 right-0 z-20">
          <LanguageToggle />
        </div>

        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-fruit-orange to-lemon-yellow rounded-full mb-4 shadow-2xl animate-bounce">
            <Droplets className="w-12 h-12 text-deep-red" />
          </div>
          <h1 className="font-display text-4xl font-bold text-cream mb-1">YANGCHAM</h1>
          <p className="text-cream/80 text-lg font-display">{t('brandSubtitle')}</p>
          <p className="text-cream/60 text-sm mt-2">{t('tagline')}</p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-3xl p-6 shadow-2xl">
          
          {/* STEP 1: Phone Entry */}
          {step === 'phone' && (
            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-fruit-orange/20 to-lemon-yellow/20 rounded-full mb-4">
                  <Phone className="w-10 h-10 text-fruit-orange" />
                </div>
                <h2 className="text-2xl font-bold text-tea-brown font-display mb-2">{t('enterPhone')}</h2>
                <p className="text-tea-brown/60">กรอกเบอร์โทรศัพท์เพื่อสะสมแต้ม</p>
              </div>

              {/* Phone Input */}
              <div className="mb-6">
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder={t('phonePlaceholder')}
                  maxLength={10}
                  className="w-full px-4 py-4 text-lg border-2 border-fruit-orange/30 rounded-2xl focus:border-fruit-orange focus:outline-none transition-all bg-cream/50 text-tea-brown placeholder-tea-brown/40 font-display text-center"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                disabled={loading || !phone || phone.length < 10}
                className="w-full py-4 bg-gradient-to-r from-fruit-orange to-fruit-orange-light hover:from-lemon-yellow hover:to-fruit-orange text-white text-xl font-bold rounded-2xl btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl font-display"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  <>
                    {t('next')} <span className="ml-2">→</span>
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl animate-fade-in">
                  <div className="flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-700 font-display">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Collect Points */}
          {step === 'collect' && (
            <div>
              {/* Header with Logout */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-fruit-orange/20">
                <div className="flex items-center gap-2">
                  <span className="text-tea-brown font-medium">📱 {phone}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 bg-cream-dark hover:bg-red-100 text-tea-brown/70 hover:text-red-600 rounded-xl transition-all text-sm font-display"
                >
                  <span>{t('logout')}</span>
                  <span>→</span>
                </button>
              </div>

              {/* Points Title */}
              <div className="text-center mb-4">
                <p className="text-tea-brown/60 text-sm mb-1">{t('yourPoints')}</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-5xl font-bold text-fruit-orange font-display">
                    {customer?.points || 0}
                  </span>
                  <span className="text-xl text-tea-brown/50 font-display">/10</span>
                </div>
              </div>

              {/* Stamp Card Grid - 2 rows x 5 columns */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[...Array(10)].map((_, index) => {
                  const isFilled = index < (customer?.points || 0)
                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square rounded-2xl flex items-center justify-center
                        transition-all duration-300
                        ${isFilled 
                          ? 'bg-gradient-to-br from-deep-red to-deep-red-dark shadow-md' 
                          : 'bg-cream-dark border-2 border-dashed border-tea-brown/20'}
                      `}
                    >
                      {isFilled ? (
                        <span className="text-2xl">🍹</span>
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-tea-brown/20" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Free drinks count */}
              <div className="text-center mb-6">
                <p className="text-tea-brown/70 text-sm">
                  🎉 {t('totalFreeDrinks')}: <span className="font-bold text-fruit-orange text-lg">{customer?.total_collected || 0}</span>
                </p>
              </div>

              {/* Redeem Options (when at max points) */}
              {showRedeemOptions && customer?.can_redeem && !success && (
                <div className="mb-6 p-5 bg-gradient-to-r from-fruit-orange/20 to-lemon-yellow/20 rounded-2xl border-2 border-fruit-orange animate-fade-in">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-fruit-orange to-lemon-yellow rounded-full flex items-center justify-center">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="text-center font-bold text-tea-brown mb-2 text-xl font-display">
                    🎉 {t('freeDrinkEarned')}
                  </p>
                  <p className="text-center text-tea-brown/70 mb-5 text-sm">
                    ต้องการแลกเครื่องดื่มฟรีตอนนี้หรือไม่?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={redeemDrink}
                      disabled={loading}
                      className="py-3 px-4 bg-fruit-orange hover:bg-fruit-orange-light text-white font-bold rounded-2xl btn-press transition-all disabled:opacity-50 font-display"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('redeemNow')}
                    </button>
                    <button
                      onClick={saveForLater}
                      disabled={loading}
                      className="py-3 px-4 bg-cream-dark hover:bg-cream text-tea-brown font-bold rounded-2xl btn-press transition-all disabled:opacity-50 font-display"
                    >
                      {t('saveForLater')}
                    </button>
                  </div>
                  <p className="text-center text-tea-brown/50 text-xs mt-3">
                    * กด "ยังไม่ใช้" จะปิดหน้าต่าง และสามารถแลกได้ครั้งหน้า
                  </p>
                </div>
              )}

              {/* Collect Point Button */}
              {!showRedeemOptions && !success && (
                <button
                  onClick={collectPoint}
                  disabled={loading || customer?.can_redeem}
                  className="w-full py-4 bg-gradient-to-r from-fruit-orange to-fruit-orange-light hover:from-lemon-yellow hover:to-fruit-orange text-white text-xl font-bold rounded-2xl btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl font-display"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  ) : customer?.can_redeem ? (
                    t('freeDrinkEarned')
                  ) : (
                    <>
                      <Star className="inline w-5 h-5 mr-2" />
                      {t('collectPoints')}
                    </>
                  )}
                </button>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-gradient-to-r from-fruit-orange/20 to-lemon-yellow/20 border-2 border-fruit-orange rounded-2xl animate-fade-in">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-10 h-10 text-fruit-orange" />
                  </div>
                  <p className="text-center text-fruit-orange font-bold text-lg font-display">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl animate-fade-in">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-700 font-display">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Success Modal Popup */}
        {showSuccessModal && customer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-cream rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-bounce-in text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-fruit-orange to-lemon-yellow rounded-full mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-tea-brown font-display mb-2">{t('thankYou')} 🎉</h2>
                <p className="text-tea-brown/70 text-lg">{t('pointCollected')}</p>
              </div>
              
              <div className="bg-gradient-to-r from-fruit-orange/10 to-lemon-yellow/10 rounded-2xl p-4 mb-6">
                <p className="text-sm text-tea-brown/60 mb-1">แต้มปัจจุบัน</p>
                <div className="flex items-center justify-center">
                  <Star className="w-6 h-6 text-fruit-orange fill-fruit-orange mr-2" />
                  <span className="text-4xl font-bold text-fruit-orange font-display">{customer.points}</span>
                  <span className="text-xl text-tea-brown/50 ml-1 font-display">/ 10</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-tea-brown/60 text-sm mb-2">ปิดหน้าต่างอัตโนมัติใน</p>
                <div className="text-3xl font-bold text-deep-red font-display">{modalCountdown}</div>
                <p className="text-tea-brown/60 text-sm">วินาที</p>
              </div>

              <button
                onClick={() => {
                  window.close()
                  // Fallback if window.close() doesn't work
                  setTimeout(() => {
                    window.location.href = 'about:blank'
                  }, 500)
                }}
                className="mt-6 w-full py-3 bg-fruit-orange hover:bg-fruit-orange-light text-white font-bold rounded-2xl btn-press transition-all font-display"
              >
                ปิดเลย
              </button>
            </div>
          </div>
        )}

        {/* Redeem Success Modal Popup */}
        {showRedeemModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-cream rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-bounce-in text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-fruit-orange to-lemon-yellow rounded-full mb-4">
                  <span className="text-5xl">🎉</span>
                </div>
                <h2 className="text-2xl font-bold text-fruit-orange font-display mb-2">Free drink redeemed!</h2>
                <p className="text-tea-brown/70 text-lg">Enjoy your YANGCHAM! 🍹</p>
              </div>
              
              <div className="bg-gradient-to-r from-fruit-orange/10 to-lemon-yellow/10 rounded-2xl p-4 mb-6">
                <p className="text-tea-brown/60 mb-2">ขอบคุณที่ใช้บริการ</p>
                <p className="text-tea-brown/50 text-sm">Thank you for choosing YANGCHAM</p>
              </div>

              <div className="text-center">
                <p className="text-tea-brown/60 text-sm mb-2">ปิดหน้าต่างอัตโนมัติใน</p>
                <div className="text-3xl font-bold text-deep-red font-display">{redeemCountdown}</div>
                <p className="text-tea-brown/60 text-sm">วินาที</p>
              </div>

              <button
                onClick={() => {
                  window.close()
                  // Fallback if window.close() doesn't work
                  setTimeout(() => {
                    window.location.href = 'about:blank'
                  }, 500)
                }}
                className="mt-6 w-full py-3 bg-fruit-orange hover:bg-fruit-orange-light text-white font-bold rounded-2xl btn-press transition-all font-display"
              >
                ปิดเลย
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-cream/50 text-sm font-display">
          <p>1 แก้ว = 1 แต้ม • 10 แต้ม = ฟรี 1 แก้ว</p>
        </div>
      </div>
    </div>
  )
}

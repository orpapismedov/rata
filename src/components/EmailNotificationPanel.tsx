'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Settings, Send, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { initEmailJS, sendManualReminder } from '@/lib/email'
import { forceEmailCheck, cleanupOldReminders, resetDailyCheck, debugEmailSystem } from '@/lib/autoEmail'
import { Pilot } from '@/lib/pilots'
import AdminProtected from './AdminProtected'

interface EmailNotificationPanelProps {
  pilots: Pilot[]
  onClose: () => void
}

export default function EmailNotificationPanel({ pilots, onClose }: EmailNotificationPanelProps) {
  const [serviceId, setServiceId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [sending, setSending] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('emailjs-config')
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      setServiceId(config.serviceId || '')
      setTemplateId(config.templateId || '')
      setPublicKey(config.publicKey || '')
      setIsConfigured(!!(config.serviceId && config.templateId && config.publicKey))
    }
  }, [])

  const saveConfiguration = () => {
    const config = { serviceId, templateId, publicKey }
    localStorage.setItem('emailjs-config', JSON.stringify(config))
    setIsConfigured(!!(serviceId && templateId && publicKey))
    setShowConfig(false)
    initEmailJS()
  }

  const runEmailCheck = async () => {
    if (!isConfigured) {
      alert('נא להגדיר את הגדרות EmailJS תחילה')
      return
    }

    setSending(true)
    try {
      await forceEmailCheck(pilots)
      setLastCheck(new Date())
      alert('בדיקת רישיונות הושלמה בהצלחה! נשלחו התראות רק למטיסים עם רישיונות הפגים בדיוק בעוד 45 ימים.')
    } catch (error) {
      console.error('Error checking reminders:', error)
      alert('שגיאה בבדיקת רישיונות')
    } finally {
      setSending(false)
    }
  }

  const sendTestEmail = async () => {
    if (!isConfigured || pilots.length === 0) return

    setSending(true)
    try {
      const testPilot = pilots[0]
      await sendManualReminder(testPilot, 'medical')
      alert('אימייל בדיקה נשלח בהצלחה!')
    } catch (error) {
      console.error('Error sending test email:', error)
      alert('שגיאה בשליחת אימייל בדיקה')
    } finally {
      setSending(false)
    }
  }

  // Get pilots with licenses expiring in exactly 45 days
  const getExpiringPilots = () => {
    const today = new Date()
    const expiring = []

    for (const pilot of pilots) {
      // Check medical certificate - exactly 45 days
      const medicalDays = Math.ceil((pilot.healthCertificateExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (medicalDays === 45) {
        expiring.push({
          pilot,
          type: 'medical',
          days: medicalDays,
          expiry: pilot.healthCertificateExpiry
        })
      }

      // Check instructor license - exactly 45 days
      if (pilot.isInstructor && pilot.instructorLicenseExpiry) {
        const instructorDays = Math.ceil((pilot.instructorLicenseExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (instructorDays === 45) {
          expiring.push({
            pilot,
            type: 'instructor',
            days: instructorDays,
            expiry: pilot.instructorLicenseExpiry
          })
        }
      }
    }

    return expiring
  }

  const expiringLicenses = getExpiringPilots()

  return (
    <motion.div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ direction: 'rtl' }}
    >
      <motion.div 
        className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        
        <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
          <Mail className="w-8 h-8 text-blue-400" />
          מערכת התראות מייל
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Section */}
          <div className="space-y-4">
            <AdminProtected errorMessage="אין לך הרשאות מנהל לשינוי הגדרות EmailJS">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    הגדרות EmailJS
                  </h4>
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    {showConfig ? 'הסתר' : 'הגדר'}
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {isConfigured ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className={`text-sm ${isConfigured ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isConfigured ? 'מוגדר ומוכן לשימוש' : 'דרוש הגדרה'}
                  </span>
                </div>

                {showConfig && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Service ID
                      </label>
                      <input
                        type="text"
                        value={serviceId}
                        onChange={e => setServiceId(e.target.value)}
                        placeholder="your_service_id"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Template ID
                      </label>
                      <input
                        type="text"
                        value={templateId}
                        onChange={e => setTemplateId(e.target.value)}
                        placeholder="your_template_id"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Public Key
                      </label>
                      <input
                        type="text"
                        value={publicKey}
                        onChange={e => setPublicKey(e.target.value)}
                        placeholder="your_public_key"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                    </div>
                    <button
                      onClick={saveConfiguration}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      שמור הגדרות
                    </button>
                  </div>
                )}
              </div>
            </AdminProtected>

            {/* Actions */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
              <h4 className="text-lg font-semibold text-white">פעולות</h4>
              
              <button
                onClick={runEmailCheck}
                disabled={!isConfigured || sending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {sending ? 'שולח...' : 'בדוק ושלח התראות (45 ימים בדיוק)'}
              </button>

              <button
                onClick={async () => {
                  resetDailyCheck()
                  await runEmailCheck()
                }}
                disabled={!isConfigured || sending}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                איפוס ובדיקה מחדש (לבדיקות)
              </button>

              <button
                onClick={() => cleanupOldReminders()}
                className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                נקה התראות ישנות
              </button>

              <button
                onClick={() => debugEmailSystem(pilots)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                🐛 Debug Info (בקונסול)
              </button>

              <button
                onClick={sendTestEmail}
                disabled={!isConfigured || sending || pilots.length === 0}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                שלח אימייל בדיקה
              </button>

              {lastCheck && (
                <p className="text-xs text-gray-400 text-center">
                  בדיקה אחרונה: {lastCheck.toLocaleString('he-IL')}
                </p>
              )}
            </div>
          </div>

          {/* Expiring Licenses */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-4">
                רישיונות הפגים בדיוק בעוד 45 ימים ({expiringLicenses.length})
              </h4>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {expiringLicenses.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    אין רישיונות הפגים בדיוק בעוד 45 ימים
                  </p>
                ) : (
                  expiringLicenses.map((item, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-white">
                          {item.pilot.firstName} {item.pilot.lastName}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300">
                          45 ימים בדיוק
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {item.type === 'medical' ? 'תעודה רפואית' : 'רישיון מדריך'}
                      </p>
                      <p className="text-xs text-gray-400">
                        תאריך פג תוקף: {item.expiry.toLocaleDateString('he-IL')}
                      </p>
                      <p className="text-xs text-gray-400">
                        דוא"ל: {item.pilot.email}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <h5 className="font-semibold text-blue-300 mb-2">מערכת התראות אוטומטית:</h5>
          <ul className="text-sm text-blue-200 space-y-1 mb-3">
            <li>• המערכת בודקת אוטומטית פעם ביום כאשר הדשבורד נטען</li>
            <li>• נשלחת התראה **אחת בלבד** לכל מטיס, בדיוק 45 ימים לפני פג תוקף הרישיון</li>
            <li>• ההתראה נשלחת גם לתעודה רפואית וגם לרישיון מדריך (אם רלוונטי)</li>
            <li>• לא יישלחו התראות נוספות לאחר השליחה הראשונה</li>
          </ul>
          
          <h5 className="font-semibold text-blue-300 mb-2">הוראות הגדרה:</h5>
          <ol className="text-sm text-blue-200 space-y-1">
            <li>1. היכנס ל-EmailJS.com וצור חשבון</li>
            <li>2. צור שירות חדש (Gmail/Outlook וכו')</li>
            <li>3. צור תבנית אימייל עם המשתנים: to_name, to_email, certificate_type, expiry_date, days_until_expiry</li>
            <li>4. העתק את ה-Service ID, Template ID ו-Public Key</li>
            <li>5. הכנס את הפרטים בהגדרות למעלה</li>
          </ol>
        </div>
      </motion.div>
    </motion.div>
  )
}

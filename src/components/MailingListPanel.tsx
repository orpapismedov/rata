'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Mail, Users, Edit, Check, AlertCircle } from 'lucide-react'
import { 
  getManagerEmails, 
  addManagerEmail, 
  updateManagerEmail, 
  deleteManagerEmail 
} from '../lib/mailingList'

interface ManagerEmail {
  id: string
  name: string
  email: string
  position: string
  createdAt: Date
}

interface MailingListPanelProps {
  onClose: () => void
}

export default function MailingListPanel({ onClose }: MailingListPanelProps) {
  const [managerEmails, setManagerEmails] = useState<ManagerEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingManager, setEditingManager] = useState<ManagerEmail | null>(null)
  const [deletingManager, setDeletingManager] = useState<ManagerEmail | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadManagerEmails()
  }, [])

  const loadManagerEmails = async () => {
    try {
      setLoading(true)
      const emails = await getManagerEmails()
      setManagerEmails(emails)
    } catch (error) {
      console.error('Error loading manager emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim() || !email.trim()) {
      setFormError('שם וכתובת מייל הם שדות חובה')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setFormError('כתובת מייל לא תקינה')
      return
    }

    try {
      if (editingManager) {
        await updateManagerEmail(editingManager.id, {
          name: name.trim(),
          email: email.trim(),
          position: position.trim()
        })
      } else {
        await addManagerEmail({
          name: name.trim(),
          email: email.trim(),
          position: position.trim()
        })
      }
      
      await loadManagerEmails()
      resetForm()
    } catch (error) {
      console.error('Error saving manager email:', error)
      setFormError('שגיאה בשמירת הנתונים')
    }
  }

  const handleEdit = (manager: ManagerEmail) => {
    setEditingManager(manager)
    setName(manager.name)
    setEmail(manager.email)
    setPosition(manager.position)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (deletingManager) {
      try {
        await deleteManagerEmail(deletingManager.id)
        await loadManagerEmails()
        setDeletingManager(null)
      } catch (error) {
        console.error('Error deleting manager email:', error)
      }
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPosition('')
    setFormError('')
    setEditingManager(null)
    setShowForm(false)
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ direction: 'rtl' }}
    >
      <motion.div 
        className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl max-w-4xl w-full mx-4 relative shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 hover:bg-gray-800 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">ניהול רשימות תפוצה</h2>
              <p className="text-gray-400">ניהול כתובות מייל של מנהלים להתראות אוטומטיות</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-1">איך זה עובד?</h3>
                <p className="text-xs text-blue-200">
                  כאשר רישיון של מטיס עומד לפוג בעוד 45 ימים, המטיס יקבל מייל כרגיל ובנוסף כל המנהלים ברשימה יקבלו עותק של המייל.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">
              רשימת מנהלים ({managerEmails.length})
            </h3>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף מנהל
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-400">טוען נתונים...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {managerEmails.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">אין מנהלים ברשימת התפוצה</p>
                  <p className="text-gray-500 text-sm">הוסף מנהלים כדי שיקבלו התראות על רישיונות שפגים</p>
                </div>
              ) : (
                managerEmails.map((manager) => (
                  <motion.div
                    key={manager.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/40 border border-gray-700 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{manager.name}</h4>
                          {manager.position && (
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                              {manager.position}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{manager.email}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          נוסף ב-{manager.createdAt.toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(manager)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingManager(manager)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  {editingManager ? 'עריכת מנהל' : 'הוספת מנהל חדש'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      שם מלא *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="שם המנהל"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      כתובת מייל *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="manager@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      תפקיד (אופציונלי)
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="מנהל תפעול, ראש צוות, וכו'"
                    />
                  </div>

                  {formError && (
                    <div className="text-red-400 text-sm">{formError}</div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {editingManager ? 'עדכן' : 'הוסף'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-600"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingManager && (
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                    <Trash2 className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">מחיקת מנהל</h3>
                  <p className="text-gray-400 mb-6">
                    האם אתה בטוח שברצונך למחוק את {deletingManager.name} מרשימת התפוצה?
                    <br />
                    המנהל לא יקבל עוד התראות על רישיונות פגים.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDelete}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    >
                      כן, מחק
                    </button>
                    <button
                      onClick={() => setDeletingManager(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 border border-gray-600"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

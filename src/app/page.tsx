// UAV License Management System - Updated July 14, 2025
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plane, 
  Users, 
  CheckCircle, 
  Clock, 
  Plus,
  User,
  Award,
  Shield,
  X,
  Edit,
  Trash2,
  BarChart3,
  Mail,
  ChevronDown,
  Search
} from 'lucide-react'
import { cn, formatDate, getDaysUntilExpiry, getExpiryStatus } from '@/lib/utils'
import { 
  getAllPilots, 
  addPilot, 
  updatePilot, 
  deletePilot, 
  initializeSampleData,
  type Pilot 
} from '@/lib/pilots'
import EmailNotificationPanel from '@/components/EmailNotificationPanel'
import AdminLogin from '@/components/AdminLogin'
import AdminProtected from '@/components/AdminProtected'
import { isAdminLoggedIn } from '@/lib/auth'

interface DashboardCard {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend: string
  color: string
  bgColor: string
}



// Calculate statistics based on actual pilot data
function calculateStats(pilots: Pilot[]) {
  const totalPilots = pilots.length
  
  // IP pilots statistics
  const ipPilots = pilots.filter(p => p.rataCertification === 'IP' || p.rataCertification === 'BOTH')
  const validIpPilots = ipPilots.filter(p => {
    const healthDays = getDaysUntilExpiry(p.healthCertificateExpiry)
    return healthDays > 0
  })
  
  // EP pilots statistics
  const epPilots = pilots.filter(p => p.rataCertification === 'EP' || p.rataCertification === 'BOTH')
  const validEpPilots = epPilots.filter(p => {
    const healthDays = getDaysUntilExpiry(p.healthCertificateExpiry)
    return healthDays > 0
  })
  
  // Instructor license statistics - Fixed to count BOTH pilots for both IP and EP
  const ipInstructors = pilots.filter(p => 
    (p.rataCertification === 'IP' || p.rataCertification === 'BOTH') && p.isInstructor
  )
  const validIpInstructors = ipInstructors.filter(p => {
    const instructorDays = p.instructorLicenseExpiry ? getDaysUntilExpiry(p.instructorLicenseExpiry) : -1
    return instructorDays > 0
  })
  
  const epInstructors = pilots.filter(p => 
    (p.rataCertification === 'EP' || p.rataCertification === 'BOTH') && p.isInstructor
  )
  const validEpInstructors = epInstructors.filter(p => {
    const instructorDays = p.instructorLicenseExpiry ? getDaysUntilExpiry(p.instructorLicenseExpiry) : -1
    return instructorDays > 0
  })
  
  // Expiring soon (within 45 days)
  const expiringPilots = pilots.filter(p => {
    const healthDays = getDaysUntilExpiry(p.healthCertificateExpiry)
    const instructorDays = p.instructorLicenseExpiry ? getDaysUntilExpiry(p.instructorLicenseExpiry) : null
    return (healthDays !== null && healthDays <= 45 && healthDays > 0) || (instructorDays !== null && instructorDays <= 45 && instructorDays > 0)
  }).length
  
  // Expired licenses
  const expiredPilots = pilots.filter(p => {
    const healthDays = getDaysUntilExpiry(p.healthCertificateExpiry)
    const instructorDays = p.instructorLicenseExpiry ? getDaysUntilExpiry(p.instructorLicenseExpiry) : null
    return (healthDays !== null && healthDays <= 0) || (instructorDays !== null && instructorDays <= 0)
  }).length

  return {
    totalPilots,
    ipPilots: ipPilots.length,
    validIpPilots: validIpPilots.length,
    epPilots: epPilots.length,
    validEpPilots: validEpPilots.length,
    ipInstructors: ipInstructors.length,
    validIpInstructors: validIpInstructors.length,
    epInstructors: epInstructors.length,
    validEpInstructors: validEpInstructors.length,
    expiringPilots,
    expiredPilots
  }
}

function PilotForm({ 
  onSubmit, 
  onClose, 
  initialData 
}: { 
  onSubmit: (pilot: Omit<Pilot, 'id' | 'createdAt'>) => void, 
  onClose: () => void,
  initialData?: Pilot
}) {
  const [firstName, setFirstName] = useState(initialData?.firstName || '')
  const [lastName, setLastName] = useState(initialData?.lastName || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [rataCertification, setRataCertification] = useState<'IP' | 'EP' | 'BOTH'>(initialData?.rataCertification || 'IP')
  const [rataCertifications, setRataCertifications] = useState<string[]>(
    initialData?.rataCertifications || ['מטיס פנים']
  )
  const [isSafetyOfficer, setIsSafetyOfficer] = useState(initialData?.isSafetyOfficer || false)
  const [categories, setCategories] = useState<string[]>(initialData?.categories || [])
  const [healthCertificateExpiry, setHealthCertificateExpiry] = useState(
    initialData?.healthCertificateExpiry 
      ? initialData.healthCertificateExpiry.toISOString().split('T')[0]
      : ''
  )
  const [isInstructor, setIsInstructor] = useState(initialData?.isInstructor || false)
  const [instructorLicenseExpiry, setInstructorLicenseExpiry] = useState(
    initialData?.instructorLicenseExpiry 
      ? initialData.instructorLicenseExpiry.toISOString().split('T')[0]
      : ''
  )
  const [restrictions, setRestrictions] = useState<'ללא' | 'שיגור והנצלה בלבד' | 'אחר'>(initialData?.restrictions || 'ללא')
  const [customRestrictions, setCustomRestrictions] = useState(initialData?.customRestrictions || '')

  const isEditing = !!initialData

  // Available certification options
  const certificationOptions = [
    'מטיס פנים',
    'מטיס חוץ', 
    'מטיס פנים וחוץ',
    'בתהליך הוצאת רשיון פנים',
    'בתהליך הוצאת רשיון חוץ'
  ]

  // Validation rules for conflicting certifications
  const hasConflictingCertifications = () => {
    const hasIP = rataCertifications.includes('מטיס פנים')
    const hasIPInProgress = rataCertifications.includes('בתהליך הוצאת רשיון פנים')
    const hasEP = rataCertifications.includes('מטיס חוץ')
    const hasEPInProgress = rataCertifications.includes('בתהליך הוצאת רשיון חוץ')
    const hasBoth = rataCertifications.includes('מטיס פנים וחוץ')
    
    // Original conflicts: Same type existing + in progress
    const sameTypeConflicts = (hasIP && hasIPInProgress) || (hasEP && hasEPInProgress)
    
    // New conflicts: "מטיס פנים וחוץ" with any "בתהליך" certification
    const bothWithInProgress = hasBoth && (hasIPInProgress || hasEPInProgress)
    
    return sameTypeConflicts || bothWithInProgress
  }

  // Calculate rataCertification from rataCertifications for backward compatibility
  const calculateRataCertification = (certifications: string[]): 'IP' | 'EP' | 'BOTH' => {
    const hasIP = certifications.includes('מטיס פנים')
    const hasEP = certifications.includes('מטיס חוץ')
    const hasBoth = certifications.includes('מטיס פנים וחוץ')
    
    if (hasBoth) return 'BOTH'
    if (hasIP && hasEP) return 'BOTH'
    if (hasIP) return 'IP'
    if (hasEP) return 'EP'
    return 'IP' // Default fallback
  }

  // Update rataCertification when rataCertifications changes
  useEffect(() => {
    const newRataCertification = calculateRataCertification(rataCertifications)
    setRataCertification(newRataCertification)
  }, [rataCertifications])

  // Calculate max date for instructor license (2 years from today)
  const getMaxInstructorDate = () => {
    const today = new Date()
    const maxDate = new Date(today)
    maxDate.setFullYear(today.getFullYear() + 2)
    return maxDate.toISOString().split('T')[0]
  }

  // Calculate min date for instructor license (today)
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate no conflicting certifications
    if (hasConflictingCertifications()) {
      alert('לא ניתן לבחור גם רישיון קיים וגם "בתהליך הוצאת רישיון" מאותו סוג, או "מטיס פנים וחוץ" יחד עם כל "בתהליך הוצאת רישיון"')
      return
    }

    // Ensure at least one certification is selected
    if (rataCertifications.length === 0) {
      alert('יש לבחור לפחות הסמכה אחת')
      return
    }

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      rataCertification: calculateRataCertification(rataCertifications),
      rataCertifications: rataCertifications,
      isSafetyOfficer: isSafetyOfficer,
      categories,
      healthCertificateExpiry: new Date(healthCertificateExpiry),
      isInstructor,
      instructorLicenseExpiry: isInstructor && instructorLicenseExpiry ? new Date(instructorLicenseExpiry) : undefined,
      restrictions,
      customRestrictions: restrictions === 'אחר' ? customRestrictions : undefined
    })
    onClose()
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
        className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 relative shadow-2xl max-h-[90vh] overflow-y-auto"
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
        
        <h3 className="text-2xl font-bold text-white mb-6 text-center">הוסף מטיס חדש</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                שם פרטי
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                שם משפחה
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              כתובת דוא"ל
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="pilot@example.com"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              הסמכת רתא (ניתן לבחור מספר)
            </label>
            <div className="space-y-2">
              {certificationOptions.map((certOption) => (
                <label key={certOption} className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={rataCertifications.includes(certOption)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRataCertifications([...rataCertifications, certOption])
                      } else {
                        setRataCertifications(rataCertifications.filter(c => c !== certOption))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{certOption}</span>
                </label>
              ))}
            </div>
            {hasConflictingCertifications() && (
              <p className="text-xs text-red-400">
                ⚠️ לא ניתן לבחור גם רישיון קיים וגם "בתהליך הוצאת רישיון" מאותו סוג, או "מטיס פנים וחוץ" יחד עם כל "בתהליך הוצאת רישיון"
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              האם קצין בטיחות?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isSafetyOfficer"
                  checked={isSafetyOfficer === true}
                  onChange={() => setIsSafetyOfficer(true)}
                  className="ml-2 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white">כן</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isSafetyOfficer"
                  checked={isSafetyOfficer === false}
                  onChange={() => setIsSafetyOfficer(false)}
                  className="ml-2 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white">לא</span>
              </label>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              קטגוריות כטמ"ם (ניתן לבחור מספר)
            </label>
            <div className="space-y-2">
              {[
                'כנף קבועה 25-2000 קג',
                'כנף קבועה 0-25 קג', 
                'כנף קבועה דו מנועי 25-2000 קג',
                'עילוי ממונע VTOL',
                'רחפן 25-2000 קג',
                'רחפן 0-25 קג'
              ].map((categoryOption) => (
                <label key={categoryOption} className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={categories.includes(categoryOption)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCategories([...categories, categoryOption])
                      } else {
                        setCategories(categories.filter(c => c !== categoryOption))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{categoryOption}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              תוקף תעודה רפואית
            </label>
            <input
              type="date"
              value={healthCertificateExpiry}
              onChange={e => setHealthCertificateExpiry(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-400">
              ניתן להזין תאריך עבר עבור תעודות שפגו
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              האם המטיס הוא מדריך מוסמך?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isInstructor"
                  checked={isInstructor === true}
                  onChange={() => setIsInstructor(true)}
                  className="ml-2 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white">כן</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isInstructor"
                  checked={isInstructor === false}
                  onChange={() => setIsInstructor(false)}
                  className="ml-2 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white">לא</span>
              </label>
            </div>
          </div>

          {isInstructor && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                תוקף רישיון מדריך
              </label>
              <input
                type="date"
                value={instructorLicenseExpiry}
                onChange={e => setInstructorLicenseExpiry(e.target.value)}
                required={isInstructor}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-400">
                ניתן להזין תאריך עבר עבור רישיונות שפגו
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              הגבלות ברישיון
            </label>
            <select
              value={restrictions}
              onChange={e => setRestrictions(e.target.value as 'ללא' | 'שיגור והנצלה בלבד' | 'אחר')}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="ללא">ללא</option>
              <option value="שיגור והנצלה בלבד">שיגור והנצלה בלבד</option>
              <option value="אחר">אחר</option>
            </select>
          </div>
          
          {restrictions === 'אחר' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                פרט את ההגבלות
              </label>
              <textarea
                value={customRestrictions}
                onChange={e => setCustomRestrictions(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="הסבר על ההגבלות..."
              />
            </div>
          )}
          
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isEditing ? 'עדכן מטיס' : 'הוסף מטיס'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-600"
            >
              ביטול
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingPilot, setEditingPilot] = useState<Pilot | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null)
  const [deletingPilot, setDeletingPilot] = useState<Pilot | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailPanel, setShowEmailPanel] = useState(false)
  const [showPilotsTable, setShowPilotsTable] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Check admin status on component mount
  useEffect(() => {
    setIsAdmin(isAdminLoggedIn())
  }, [])
  
  // Load pilots from Firebase on component mount
  useEffect(() => {
    const loadPilots = async () => {
      try {
        setLoading(true)
        const pilotsData = await getAllPilots()
        console.log('Loaded pilots data:', pilotsData) // Debug log
        pilotsData.forEach(pilot => {
          console.log(`${pilot.firstName} ${pilot.lastName} - isSafetyOfficer:`, pilot.isSafetyOfficer)
        })
        setPilots(pilotsData)
        
        // Automatic email reminders now handled by GitHub Actions
        // No need to run frontend email checks anymore
        
      } catch (error) {
        console.error('Error loading pilots:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPilots()
  }, [])
  
  const stats = calculateStats(pilots)

  // Filter and sort pilots function
  const getFilteredAndSortedPilots = () => {
    return pilots
      .filter(pilot => {
        if (!searchTerm) return true
        const fullName = `${pilot.firstName} ${pilot.lastName}`.toLowerCase()
        return fullName.includes(searchTerm.toLowerCase())
      })
      .sort((a, b) => {
        // Sort alphabetically by first name, then by last name
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        return nameA.localeCompare(nameB, 'he') // Hebrew locale for proper sorting
      })
  }

  const dashboardCards: DashboardCard[] = [
    {
      title: 'מטיסים פעילים',
      value: stats.totalPilots.toString(),
      icon: Users,
      trend: '+3 החודש',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'רישיונות מטיס פנים תקפים',
      value: `${stats.validIpPilots} מתוך ${stats.ipPilots}`,
      icon: Award,
      trend: '+2 החודש',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'רישיונות מטיס חוץ תקפים',
      value: `${stats.validEpPilots} מתוך ${stats.epPilots}`,
      icon: Shield,
      trend: '+1 החודש',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'רישיונות מדריך מטיס פנים תקפים',
      value: `${stats.validIpInstructors} מתוך ${stats.ipInstructors}`,
      icon: Award,
      trend: 'מדריכים פעילים',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      title: 'רישיונות מדריך מטיס חוץ תקפים',
      value: `${stats.validEpInstructors} מתוך ${stats.epInstructors}`,
      icon: Shield,
      trend: 'מדריכים פעילים',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10'
    },
    {
      title: 'כמות רשיונות לא בתוקף',
      value: stats.expiredPilots.toString(),
      icon: X,
      trend: 'נדרש חידוש',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    }
  ]

  const handleAddPilot = async (newPilot: Omit<Pilot, 'id' | 'createdAt'>) => {
    try {
      const pilot = await addPilot(newPilot)
      setPilots([...pilots, pilot])
    } catch (error) {
      console.error('Error adding pilot:', error)
    }
  }

  const handleEditPilot = async (editedPilot: Omit<Pilot, 'id' | 'createdAt'>) => {
    if (editingPilot && editingPilot.id) {
      try {
        await updatePilot(editingPilot.id, editedPilot)
        const updatedPilots = pilots.map(pilot => 
          pilot.id === editingPilot.id 
            ? { ...pilot, ...editedPilot }
            : pilot
        )
        setPilots(updatedPilots)
        setEditingPilot(null)
      } catch (error) {
        console.error('Error updating pilot:', error)
      }
    }
  }

  const handleDeletePilot = (pilot: Pilot) => {
    if (!isAdminLoggedIn()) {
      alert('🚫 אין לך הרשאות מנהל למחיקת מטיסים. יש להתחבר כמנהל תחילה.')
      return
    }
    setDeletingPilot(pilot)
  }

  const confirmDelete = async () => {
    if (deletingPilot && deletingPilot.id) {
      try {
        await deletePilot(deletingPilot.id)
        setPilots(pilots.filter(pilot => pilot.id !== deletingPilot.id))
        setDeletingPilot(null)
      } catch (error) {
        console.error('Error deleting pilot:', error)
      }
    }
  }

  const cancelDelete = () => {
    setDeletingPilot(null)
  }

  const getExpiryDetails = (pilot: Pilot) => {
    const healthStatus = getExpiryStatus(pilot.healthCertificateExpiry)
    const healthDays = getDaysUntilExpiry(pilot.healthCertificateExpiry)
    
    let instructorStatus = null
    let instructorDays = null
    
    if (pilot.instructorLicenseExpiry) {
      instructorStatus = getExpiryStatus(pilot.instructorLicenseExpiry)
      instructorDays = getDaysUntilExpiry(pilot.instructorLicenseExpiry)
    }
    
    return { healthStatus, healthDays, instructorStatus, instructorDays }
  }

  const getStatusBadge = (status: string, days: number) => {
    const colors = {
      expired: 'bg-red-500/20 text-red-300 border-red-500/30',
      critical: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      good: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    }
    
    return (
      <span className={cn('px-2 py-1 text-xs rounded-full border', colors[status as keyof typeof colors])}>
        {days < 0 ? 'פג תוקף' : `${days} ימים`}
      </span>
    )
  }

  const upcomingExpirations = pilots.flatMap(pilot => {
    const expirations = []
    const healthDays = getDaysUntilExpiry(pilot.healthCertificateExpiry)
    
    if (healthDays <= 45 && healthDays >= 0) {
      expirations.push({
        pilotName: `${pilot.firstName} ${pilot.lastName}`,
        type: 'תעודה רפואית',
        days: healthDays,
        date: pilot.healthCertificateExpiry
      })
    }
    
    if (pilot.instructorLicenseExpiry) {
      const instructorDays = getDaysUntilExpiry(pilot.instructorLicenseExpiry)
      if (instructorDays <= 45 && instructorDays >= 0) {
        expirations.push({
          pilotName: `${pilot.firstName} ${pilot.lastName}`,
          type: 'רישיון מדריך',
          days: instructorDays,
          date: pilot.instructorLicenseExpiry
        })
      }
    }
    
    return expirations
  }).sort((a, b) => a.days - b.days)

  const expiredLicenses = pilots.flatMap(pilot => {
    const expired = []
    const healthDays = getDaysUntilExpiry(pilot.healthCertificateExpiry)
    
    if (healthDays < 0) {
      expired.push({
        pilotName: `${pilot.firstName} ${pilot.lastName}`,
        type: 'תעודה רפואית',
        days: Math.abs(healthDays),
        date: pilot.healthCertificateExpiry
      })
    }
    
    if (pilot.instructorLicenseExpiry) {
      const instructorDays = getDaysUntilExpiry(pilot.instructorLicenseExpiry)
      if (instructorDays < 0) {
        expired.push({
          pilotName: `${pilot.firstName} ${pilot.lastName}`,
          type: 'רישיון מדריך',
          days: Math.abs(instructorDays),
          date: pilot.instructorLicenseExpiry
        })
      }
    }
    
    return expired
  }).sort((a, b) => b.days - a.days)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden" style={{ direction: 'rtl' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <p className="text-white text-lg">טוען נתונים...</p>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-lg">טוען נתונים...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                <span className="mr-2 text-lg sm:text-xl font-bold text-white hidden sm:block">מערכת ניהול רישיונות כטמ"ם</span>
                <span className="mr-2 text-sm font-bold text-white sm:hidden">כטמ"ם אירונאוטיקס</span>
              </div>
            </div>
            <AdminLogin onAdminStatusChange={setIsAdmin} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">מערכת ניהול רשיונות כטמ"ם אירונאוטיקס</h1>
              <p className="text-gray-400 text-sm sm:text-base">ניהול רישיונות מטיסי כטמ"ם ותעודות רפואיות</p>
            </div>
            <div className="flex gap-3">
              <motion.button 
                onClick={() => setShowStats(!showStats)}
                className={`group ${showStats ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'} text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm sm:text-base`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                {showStats ? 'הסתר סטטיסטיקה' : 'סטטיסטיקה'}
              </motion.button>
              {/* Hidden on mobile - Email notifications button */}
              <motion.button 
                onClick={() => {
                  if (!isAdminLoggedIn()) {
                    alert('🚫 אין לך הרשאות מנהל לגישה לאזור התראות המייל. יש להתחבר כמנהל תחילה.')
                    return
                  }
                  setShowEmailPanel(true)
                }}
                className="group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl items-center gap-2 text-sm sm:text-base hidden sm:flex"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                התראות מייל
              </motion.button>
              <motion.button 
                onClick={() => setShowForm(true)}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                הוסף מטיס
              </motion.button>
            </div>
          </div>

          {/* Stats Grid - Conditional Display */}
          {showStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
              {dashboardCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/60 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <div className={cn('p-3 rounded-lg', card.bgColor)}>
                      <card.icon className={cn('h-6 w-6', card.color)} />
                    </div>
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-400">{card.title}</p>
                      <p className="text-2xl font-semibold text-white">{card.value}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">{card.trend}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="space-y-6">
            {/* Pilots Table - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setShowPilotsTable(!showPilotsTable)}
                    className="flex items-center justify-between w-full text-right hover:bg-gray-700/30 rounded-lg px-2 py-1 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">רשימת מטיסים</h2>
                      {searchTerm && (
                        <span className="text-sm text-gray-400">
                          ({getFilteredAndSortedPilots().length} מתוך {pilots.length})
                        </span>
                      )}
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${showPilotsTable ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {showPilotsTable && (
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="חפש מטיס..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <AnimatePresence>
                {showPilotsTable && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Mobile Cards View */}
                    <div className="block lg:hidden">
                      <div className="space-y-4 p-4">
                  {getFilteredAndSortedPilots()
                    .map((pilot, index) => {
                      const { healthStatus, healthDays, instructorStatus, instructorDays } = getExpiryDetails(pilot)
                      
                      return (
                        <motion.div
                          key={pilot.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="bg-gray-700/30 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-500/20 rounded-lg ml-3">
                                <User className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <button
                                  onClick={() => setSelectedPilot(pilot)}
                                  className="text-sm font-medium text-white hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                  {pilot.firstName} {pilot.lastName}
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingPilot(pilot)}
                                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                <span className="text-xs">עריכה</span>
                              </button>
                              <button
                                onClick={() => handleDeletePilot(pilot)}
                                className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="text-xs">מחק</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {pilot.rataCertifications?.map((cert, index) => (
                              <span 
                                key={index}
                                className={cn(
                                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                  cert.includes('בתהליך') 
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : cert.includes('פנים וחוץ')
                                    ? "bg-indigo-500/20 text-indigo-300"
                                    : cert.includes('פנים')
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : cert.includes('חוץ')
                                    ? "bg-purple-500/20 text-purple-300"
                                    : "bg-gray-500/20 text-gray-300"
                                )}
                              >
                                {cert}
                              </span>
                            ))}
                            {pilot.isInstructor && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                                מדריך
                              </span>
                            )}
                            {pilot.isSafetyOfficer === true && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                                קב"ט
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">תעודה רפואית: </span>
                              <span className="text-gray-300">{formatDate(pilot.healthCertificateExpiry)}</span>
                              <div className="mt-1">{getStatusBadge(healthStatus, healthDays)}</div>
                            </div>
                            
                            <div>
                              <span className="text-gray-400">רישיון מדריך: </span>
                              {pilot.isInstructor && pilot.instructorLicenseExpiry ? (
                                <div>
                                  <span className="text-gray-300">{formatDate(pilot.instructorLicenseExpiry)}</span>
                                  <div className="mt-1">{getStatusBadge(instructorStatus!, instructorDays!)}</div>
                                </div>
                              ) : pilot.isInstructor ? (
                                <span className="text-yellow-400">חסר תאריך</span>
                              ) : (
                                <span className="text-gray-500">לא מדריך</span>
                              )}
                            </div>
                            
                            <div>
                              <span className="text-gray-400">הגבלות: </span>
                              <span className="text-gray-300">
                                {pilot.restrictions === 'אחר' ? pilot.customRestrictions : pilot.restrictions}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                </div>
              </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/60">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        מטיס
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        הסמכה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        תוקף תעודה רפואית
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        תוקף רישיון מדריך
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        הגבלות
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        פעולות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {getFilteredAndSortedPilots()
                      .map((pilot, index) => {
                        const { healthStatus, healthDays, instructorStatus, instructorDays } = getExpiryDetails(pilot)
                        
                        return (
                          <motion.tr
                            key={pilot.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="hover:bg-gray-700/30 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="p-2 bg-blue-500/20 rounded-lg ml-3">
                                  <User className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                  <button
                                    onClick={() => setSelectedPilot(pilot)}
                                    className="text-sm font-medium text-white hover:text-blue-400 transition-colors cursor-pointer"
                                  >
                                    {pilot.firstName} {pilot.lastName}
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {pilot.rataCertifications?.map((cert, index) => (
                                  <span 
                                    key={index}
                                    className={cn(
                                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                                      cert.includes('בתהליך') 
                                        ? "bg-yellow-500/20 text-yellow-300"
                                        : cert.includes('פנים וחוץ')
                                        ? "bg-indigo-500/20 text-indigo-300"
                                        : cert.includes('פנים')
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : cert.includes('חוץ')
                                        ? "bg-purple-500/20 text-purple-300"
                                        : "bg-gray-500/20 text-gray-300"
                                    )}
                                  >
                                    {cert}
                                  </span>
                                ))}
                                {pilot.isInstructor && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 whitespace-nowrap">
                                    מדריך
                                  </span>
                                )}
                                {pilot.isSafetyOfficer === true && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 whitespace-nowrap">
                                    קב"ט
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{formatDate(pilot.healthCertificateExpiry)}</div>
                              {getStatusBadge(healthStatus, healthDays)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {pilot.isInstructor && pilot.instructorLicenseExpiry ? (
                                <div>
                                  <div className="text-sm text-gray-300">{formatDate(pilot.instructorLicenseExpiry)}</div>
                                  {getStatusBadge(instructorStatus!, instructorDays!)}
                                </div>
                              ) : pilot.isInstructor ? (
                                <span className="text-yellow-400">חסר תאריך</span>
                              ) : (
                                <span className="text-gray-500">לא מדריך</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-300 max-w-xs">
                                {pilot.restrictions === 'אחר' ? pilot.customRestrictions : pilot.restrictions}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingPilot(pilot)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-500/10"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="text-xs">עריכה</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePilot(pilot)}
                                  className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="text-xs">מחק</span>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Status Sections Grid - Below the table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Expirations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl"
              >
                <div className="px-4 py-3 border-b border-gray-700">
                  <h2 className="text-base font-semibold text-white">פגים בקרוב</h2>
                  <p className="text-xs text-gray-400">תוקף של 45 ימים ומטה</p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {upcomingExpirations.length === 0 ? (
                      <div className="text-center py-3">
                        <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">אין פגים בקרוב</p>
                      </div>
                    ) : (
                      upcomingExpirations.slice(0, 4).map((expiration, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
                          <div className="p-1.5 bg-orange-500/20 rounded-lg">
                            <Clock className="h-3 w-3 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{expiration.pilotName}</p>
                            <p className="text-xs text-gray-400">{expiration.type}</p>
                            <p className="text-xs text-orange-400">{expiration.days} ימים נותרו</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Expired Licenses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl"
              >
                <div className="px-4 py-3 border-b border-gray-700">
                  <h2 className="text-base font-semibold text-white">רשיונות שפגו</h2>
                  <p className="text-xs text-gray-400">רשיונות ותעודות שפג תוקפן</p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {expiredLicenses.length === 0 ? (
                      <div className="text-center py-3">
                        <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">אין רשיונות שפגו</p>
                      </div>
                    ) : (
                      expiredLicenses.slice(0, 4).map((expired, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
                          <div className="p-1.5 bg-red-500/20 rounded-lg">
                            <X className="h-3 w-3 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{expired.pilotName}</p>
                            <p className="text-xs text-gray-400">{expired.type}</p>
                            <p className="text-xs text-red-400">פג לפני {expired.days} ימים</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Add Pilot Form Modal */}
      <AnimatePresence>
        {showForm && (
          <PilotForm
            onSubmit={handleAddPilot}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit Pilot Form Modal */}
      <AnimatePresence>
        {editingPilot && (
          <PilotForm
            onSubmit={handleEditPilot}
            onClose={() => setEditingPilot(null)}
            initialData={editingPilot}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingPilot && (
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ direction: 'rtl' }}
          >
            <motion.div 
              className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 max-w-xs w-full mx-4 relative shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                  <Trash2 className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">מחיקת מטיס</h3>
                <p className="text-gray-400 mb-6">
                  האם אתה בטוח שברצונך למחוק את המטיס {deletingPilot.firstName} {deletingPilot.lastName}?
                  <br />
                  פעולה זו לא ניתנת לביטול.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={confirmDelete}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    כן, מחק
                  </button>
                  <button
                    onClick={cancelDelete}
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

      {/* Pilot Detail Modal */}
      <AnimatePresence>
        {selectedPilot && (
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ direction: 'rtl' }}
          >
            <motion.div 
              className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 relative shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setSelectedPilot(null)}
                className="absolute top-4 left-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/20 mb-4">
                  <User className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {selectedPilot.firstName} {selectedPilot.lastName}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/40 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">הסמכת רתא</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPilot.rataCertifications?.map((cert, index) => (
                      <span 
                        key={index}
                        className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                          cert.includes('בתהליך') 
                            ? "bg-yellow-500/20 text-yellow-300"
                            : cert.includes('פנים וחוץ')
                            ? "bg-indigo-500/20 text-indigo-300"
                            : cert.includes('פנים')
                            ? "bg-emerald-500/20 text-emerald-300"
                            : cert.includes('חוץ')
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-gray-500/20 text-gray-300"
                        )}
                      >
                        {cert}
                      </span>
                    ))}
                    {selectedPilot.isInstructor && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                        מדריך
                      </span>
                    )}
                    {selectedPilot.isSafetyOfficer === true && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300">
                        קצין בטיחות
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/40 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">קטגוריות כטמ"ם</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPilot.categories && selectedPilot.categories.length > 0 ? (
                      selectedPilot.categories.map((category, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                          {category}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">לא הוגדרו קטגוריות</span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/40 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">תעודה רפואית</h4>
                  <p className="text-white">{formatDate(selectedPilot.healthCertificateExpiry)}</p>
                  <div className="mt-2">
                    {(() => {
                      const healthDays = getDaysUntilExpiry(selectedPilot.healthCertificateExpiry)
                      const healthStatus = getExpiryStatus(selectedPilot.healthCertificateExpiry)
                      return getStatusBadge(healthStatus, healthDays)
                    })()}
                  </div>
                </div>

                {selectedPilot.isInstructor && (
                  <div className="bg-gray-800/40 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">רישיון מדריך</h4>
                    {selectedPilot.instructorLicenseExpiry ? (
                      <div>
                        <p className="text-white">{formatDate(selectedPilot.instructorLicenseExpiry)}</p>
                        <div className="mt-2">
                          {(() => {
                            const instructorDays = getDaysUntilExpiry(selectedPilot.instructorLicenseExpiry!)
                            const instructorStatus = getExpiryStatus(selectedPilot.instructorLicenseExpiry!)
                            return getStatusBadge(instructorStatus, instructorDays)
                          })()}
                        </div>
                      </div>
                    ) : (
                      <p className="text-yellow-400">חסר תאריך</p>
                    )}
                  </div>
                )}

                <div className="bg-gray-800/40 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">הגבלות</h4>
                  <p className="text-white">
                    {selectedPilot.restrictions === 'אחר' ? selectedPilot.customRestrictions : selectedPilot.restrictions}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingPilot(selectedPilot)
                    setSelectedPilot(null)
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  עריכה
                </button>
                <button
                  onClick={() => {
                    if (!isAdminLoggedIn()) {
                      alert('🚫 אין לך הרשאות מנהל למחיקת מטיסים. יש להתחבר כמנהל תחילה.')
                      return
                    }
                    setDeletingPilot(selectedPilot)
                    setSelectedPilot(null)
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  מחק
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Notification Panel */}
      <AnimatePresence>
        {showEmailPanel && (
          <EmailNotificationPanel
            pilots={pilots}
            onClose={() => setShowEmailPanel(false)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

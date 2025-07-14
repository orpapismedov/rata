import { checkAndSendReminders, initEmailJS, isEmailJSConfigured } from './email'
import { Pilot } from './pilots'

// Store last check date and sent reminders in localStorage
const LAST_CHECK_KEY = 'last-email-check'
const SENT_REMINDERS_KEY = 'sent-reminders'

interface SentReminder {
  pilotId: string
  licenseType: 'medical' | 'instructor'
  expiryDate: string
  dateSent: string
}

// Get list of already sent reminders
const getSentReminders = (): SentReminder[] => {
  const stored = localStorage.getItem(SENT_REMINDERS_KEY)
  return stored ? JSON.parse(stored) : []
}

// Add a reminder to the sent list
const addSentReminder = (pilotId: string, licenseType: 'medical' | 'instructor', expiryDate: Date): void => {
  const sentReminders = getSentReminders()
  const newReminder: SentReminder = {
    pilotId,
    licenseType,
    expiryDate: expiryDate.toISOString(),
    dateSent: new Date().toISOString()
  }
  
  sentReminders.push(newReminder)
  localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sentReminders))
}

// Check if reminder was already sent for this pilot and license
const wasReminderSent = (pilotId: string, licenseType: 'medical' | 'instructor', expiryDate: Date): boolean => {
  const sentReminders = getSentReminders()
  return sentReminders.some(reminder => 
    reminder.pilotId === pilotId && 
    reminder.licenseType === licenseType && 
    reminder.expiryDate === expiryDate.toISOString()
  )
}

// Check if we should run automatic email check (once per day)
export const shouldRunAutomaticCheck = (): boolean => {
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
  if (!lastCheck) return true
  
  const lastCheckDate = new Date(lastCheck)
  const today = new Date()
  
  // Check if it's been at least 24 hours
  const timeDiff = today.getTime() - lastCheckDate.getTime()
  const hoursDiff = timeDiff / (1000 * 3600)
  
  return hoursDiff >= 24
}

// Check for pilots with licenses expiring in exactly 45 days and send reminders
export const checkAndSendSingleReminders = async (pilots: Pilot[]): Promise<void> => {
  const today = new Date()
  console.log(`📅 Today is: ${today.toLocaleDateString('he-IL')}`)
  
  for (const pilot of pilots) {
    if (!pilot.id) continue
    
    console.log(`👤 Checking pilot: ${pilot.firstName} ${pilot.lastName}`)
    
    // Check medical certificate - exactly 45 days before expiry
    const medicalExpiry = new Date(pilot.healthCertificateExpiry)
    const medicalDaysLeft = Math.ceil((medicalExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    console.log(`🏥 Medical certificate expires: ${medicalExpiry.toLocaleDateString('he-IL')} (${medicalDaysLeft} days left)`)
    
    if (medicalDaysLeft === 45) {
      console.log(`🎯 Medical certificate expires in exactly 45 days!`)
      
      if (!wasReminderSent(pilot.id, 'medical', medicalExpiry)) {
        console.log(`📧 Sending medical reminder to ${pilot.email}`)
        try {
          const { sendExpiryReminder } = await import('./email')
          
          const success = await sendExpiryReminder({
            pilotName: `${pilot.firstName} ${pilot.lastName}`,
            pilotEmail: pilot.email,
            licenseType: 'medical',
            expiryDate: medicalExpiry.toLocaleDateString('he-IL'),
            daysUntilExpiry: medicalDaysLeft
          })
          
          if (success) {
            addSentReminder(pilot.id, 'medical', medicalExpiry)
            console.log(`✅ Medical certificate reminder sent to ${pilot.firstName} ${pilot.lastName}`)
          } else {
            console.log(`❌ Failed to send medical reminder to ${pilot.firstName} ${pilot.lastName}`)
          }
        } catch (error) {
          console.error(`❌ Error sending medical reminder to ${pilot.firstName} ${pilot.lastName}:`, error)
        }
      } else {
        console.log(`⏭️ Medical reminder already sent to ${pilot.firstName} ${pilot.lastName}`)
      }
    }

    // Check instructor license - exactly 45 days before expiry
    if (pilot.isInstructor && pilot.instructorLicenseExpiry) {
      const instructorExpiry = new Date(pilot.instructorLicenseExpiry)
      const instructorDaysLeft = Math.ceil((instructorExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`👨‍🏫 Instructor license expires: ${instructorExpiry.toLocaleDateString('he-IL')} (${instructorDaysLeft} days left)`)
      
      if (instructorDaysLeft === 45) {
        console.log(`🎯 Instructor license expires in exactly 45 days!`)
        
        if (!wasReminderSent(pilot.id, 'instructor', instructorExpiry)) {
          console.log(`📧 Sending instructor reminder to ${pilot.email}`)
          try {
            const { sendExpiryReminder } = await import('./email')
            
            const success = await sendExpiryReminder({
              pilotName: `${pilot.firstName} ${pilot.lastName}`,
              pilotEmail: pilot.email,
              licenseType: 'instructor',
              expiryDate: instructorExpiry.toLocaleDateString('he-IL'),
              daysUntilExpiry: instructorDaysLeft
            })
            
            if (success) {
              addSentReminder(pilot.id, 'instructor', instructorExpiry)
              console.log(`✅ Instructor license reminder sent to ${pilot.firstName} ${pilot.lastName}`)
            } else {
              console.log(`❌ Failed to send instructor reminder to ${pilot.firstName} ${pilot.lastName}`)
            }
          } catch (error) {
            console.error(`❌ Error sending instructor reminder to ${pilot.firstName} ${pilot.lastName}:`, error)
          }
        } else {
          console.log(`⏭️ Instructor reminder already sent to ${pilot.firstName} ${pilot.lastName}`)
        }
      }
    }
  }
}

// Run automatic email check if needed
export const runAutomaticEmailCheck = async (pilots: Pilot[]): Promise<void> => {
  console.log('🔍 Starting automatic email check...')
  
  if (!shouldRunAutomaticCheck()) {
    console.log('⏰ Skipping check - already checked today')
    return
  }
  
  try {
    // Check if EmailJS is configured (either via env vars or localStorage)
    if (!isEmailJSConfigured()) {
      console.log('❌ EmailJS not configured - please set environment variables or configure via admin panel')
      return
    }
    
    // Initialize EmailJS with the configuration
    const initialized = initEmailJS()
    if (!initialized) {
      console.log('❌ Failed to initialize EmailJS')
      return
    }
    
    console.log('✅ EmailJS configured and initialized, checking pilots...')
    console.log(`👥 Found ${pilots.length} pilots to check`)
    
    await checkAndSendSingleReminders(pilots)
    
    // Update last check date
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
    console.log('✅ Automatic email check completed')
  } catch (error) {
    console.error('❌ Error in automatic email check:', error)
  }
}

// Manual override to force check
export const forceEmailCheck = async (pilots: Pilot[]): Promise<void> => {
  console.log('🔄 Forcing email check...')
  await checkAndSendSingleReminders(pilots)
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
}

// Reset the daily check timer to force a new check
export const resetDailyCheck = (): void => {
  localStorage.removeItem(LAST_CHECK_KEY)
  console.log('🔄 Daily check timer reset - next check will run immediately')
}

// Clean up old sent reminders (older than 1 year)
export const cleanupOldReminders = (): void => {
  const sentReminders = getSentReminders()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  const cleanedReminders = sentReminders.filter(reminder => 
    new Date(reminder.dateSent) > oneYearAgo
  )
  
  localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(cleanedReminders))
}

// Debug function to check current status
export const debugEmailSystem = (pilots: Pilot[]): void => {
  console.log('🐛 EMAIL SYSTEM DEBUG INFO:')
  console.log('📅 Today:', new Date().toLocaleDateString('he-IL'))
  
  const config = localStorage.getItem('emailjs-config')
  const emailConfig = config ? JSON.parse(config) : null
  console.log('⚙️ EmailJS configured:', !!emailConfig?.serviceId)
  
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
  console.log('⏰ Last check:', lastCheck ? new Date(lastCheck).toLocaleString('he-IL') : 'Never')
  console.log('🔄 Should run check:', shouldRunAutomaticCheck())
  
  const sentReminders = getSentReminders()
  console.log('📧 Sent reminders count:', sentReminders.length)
  
  console.log('👥 Pilots with licenses expiring in 45 days:')
  const today = new Date()
  pilots.forEach(pilot => {
    const medicalDays = Math.ceil((pilot.healthCertificateExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const instructorDays = pilot.instructorLicenseExpiry ? 
      Math.ceil((pilot.instructorLicenseExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
    
    if (medicalDays === 45 || instructorDays === 45) {
      console.log(`  👤 ${pilot.firstName} ${pilot.lastName}:`)
      if (medicalDays === 45) {
        const wasSent = wasReminderSent(pilot.id!, 'medical', pilot.healthCertificateExpiry)
        console.log(`    🏥 Medical: ${medicalDays} days (reminder sent: ${wasSent})`)
      }
      if (instructorDays === 45) {
        const wasSent = wasReminderSent(pilot.id!, 'instructor', pilot.instructorLicenseExpiry!)
        console.log(`    👨‍🏫 Instructor: ${instructorDays} days (reminder sent: ${wasSent})`)
      }
    }
  })
}

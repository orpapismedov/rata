import emailjs from '@emailjs/browser'

// Get EmailJS configuration from localStorage
const getEmailJSConfig = () => {
  if (typeof window !== 'undefined') {
    const config = localStorage.getItem('emailjs-config')
    return config ? JSON.parse(config) : null
  }
  return null
}

// Initialize EmailJS with stored configuration
export const initEmailJS = () => {
  const config = getEmailJSConfig()
  if (config && config.publicKey) {
    emailjs.init(config.publicKey)
    return true
  }
  return false
}

export interface EmailData {
  pilotName: string
  pilotEmail: string
  licenseType: 'medical' | 'instructor'
  expiryDate: string
  daysUntilExpiry: number
}

// Send expiry reminder email
export const sendExpiryReminder = async (data: EmailData): Promise<boolean> => {
  try {
    const config = getEmailJSConfig()
    if (!config || !config.serviceId || !config.templateId) {
      throw new Error('EmailJS configuration not found')
    }

    const templateParams = {
      to_name: data.pilotName,
      to_email: data.pilotEmail,
      certificate_type: data.licenseType === 'medical' ? 'תעודה רפואית' : 'רישיון מדריך',
      expiry_date: data.expiryDate,
      days_until_expiry: data.daysUntilExpiry,
      from_name: 'מערכת ניהול רישיונות UAV'
    }

    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams
    )

    console.log('Email sent successfully:', response.status, response.text)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// Check for pilots with expiring licenses and send reminders
export const checkAndSendReminders = async (pilots: any[]): Promise<void> => {
  const today = new Date()
  const reminderDays = [45, 30, 14, 7, 3, 1] // Send reminders at these intervals

  for (const pilot of pilots) {
    // Check medical certificate
    const medicalExpiry = new Date(pilot.healthCertificateExpiry)
    const medicalDaysLeft = Math.ceil((medicalExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (reminderDays.includes(medicalDaysLeft) && medicalDaysLeft > 0) {
      await sendExpiryReminder({
        pilotName: `${pilot.firstName} ${pilot.lastName}`,
        pilotEmail: pilot.email,
        licenseType: 'medical',
        expiryDate: medicalExpiry.toLocaleDateString('he-IL'),
        daysUntilExpiry: medicalDaysLeft
      })
    }

    // Check instructor license if applicable
    if (pilot.isInstructor && pilot.instructorLicenseExpiry) {
      const instructorExpiry = new Date(pilot.instructorLicenseExpiry)
      const instructorDaysLeft = Math.ceil((instructorExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (reminderDays.includes(instructorDaysLeft) && instructorDaysLeft > 0) {
        await sendExpiryReminder({
          pilotName: `${pilot.firstName} ${pilot.lastName}`,
          pilotEmail: pilot.email,
          licenseType: 'instructor',
          expiryDate: instructorExpiry.toLocaleDateString('he-IL'),
          daysUntilExpiry: instructorDaysLeft
        })
      }
    }
  }
}

// Manual send reminder for a specific pilot
export const sendManualReminder = async (pilot: any, licenseType: 'medical' | 'instructor'): Promise<boolean> => {
  const expiryDate = licenseType === 'medical' 
    ? new Date(pilot.healthCertificateExpiry)
    : new Date(pilot.instructorLicenseExpiry)
  
  const today = new Date()
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return await sendExpiryReminder({
    pilotName: `${pilot.firstName} ${pilot.lastName}`,
    pilotEmail: pilot.email,
    licenseType,
    expiryDate: expiryDate.toLocaleDateString('he-IL'),
    daysUntilExpiry: daysLeft
  })
}

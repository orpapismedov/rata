#!/usr/bin/env node

// GitHub Actions Email Reminder Script
// This script runs daily on GitHub's servers to send automatic email reminders

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Initialize Firebase Admin
function initializeFirebase() {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    return getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Calculate days until expiry
function getDaysUntilExpiry(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Send email via EmailJS REST API
async function sendEmailViaEmailJS(emailData) {
  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        pilot_name: emailData.pilotName,
        pilot_email: emailData.pilotEmail,
        license_type: emailData.licenseType === 'medical' ? 'תעודה רפואית' : 'רישיון מדריך',
        expiry_date: emailData.expiryDate,
        days_until_expiry: emailData.daysUntilExpiry,
        to_email: emailData.pilotEmail
      }
    });

    return response.status === 200;
  } catch (error) {
    console.error('EmailJS error:', error.response?.data || error.message);
    return false;
  }
}

// Check if reminder was already sent
async function wasReminderSent(db, pilotId, licenseType, expiryDate) {
  try {
    const reminderRef = db.collection('emailReminders').doc(`${pilotId}_${licenseType}_${expiryDate}`);
    const doc = await reminderRef.get();
    return doc.exists;
  } catch (error) {
    console.error('Error checking reminder:', error);
    return false;
  }
}

// Mark reminder as sent
async function markReminderSent(db, pilotId, licenseType, expiryDate, pilotName) {
  try {
    const reminderRef = db.collection('emailReminders').doc(`${pilotId}_${licenseType}_${expiryDate}`);
    await reminderRef.set({
      pilotId,
      pilotName,
      licenseType,
      expiryDate,
      sentAt: new Date().toISOString(),
      sentBy: 'github-actions'
    });
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
  }
}

// Main email checking function
async function checkAndSendReminders() {
  console.log('🔍 Starting daily email reminder check...');
  
  const db = initializeFirebase();
  const today = new Date();
  
  try {
    // Get all pilots
    const pilotsSnapshot = await db.collection('pilots').get();
    const pilots = pilotsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`👥 Found ${pilots.length} pilots to check`);
    
    let emailsSent = 0;
    
    for (const pilot of pilots) {
      if (!pilot.email) {
        console.log(`⚠️ Pilot ${pilot.firstName} ${pilot.lastName} has no email address`);
        continue;
      }
      
      console.log(`👤 Checking pilot: ${pilot.firstName} ${pilot.lastName}`);
      
      // Check medical certificate - exactly 45 days before expiry
      if (pilot.healthCertificateExpiry) {
        const healthExpiry = new Date(pilot.healthCertificateExpiry.seconds * 1000);
        const healthDaysLeft = getDaysUntilExpiry(healthExpiry);
        
        console.log(`🏥 Medical certificate expires: ${healthExpiry.toLocaleDateString('he-IL')} (${healthDaysLeft} days left)`);
        
        if (healthDaysLeft === 45) {
          const reminderKey = `${pilot.id}_medical_${healthExpiry.toISOString().split('T')[0]}`;
          const alreadySent = await wasReminderSent(db, pilot.id, 'medical', healthExpiry.toISOString().split('T')[0]);
          
          if (!alreadySent) {
            console.log(`📧 Sending medical reminder to ${pilot.email}`);
            
            const emailData = {
              pilotName: `${pilot.firstName} ${pilot.lastName}`,
              pilotEmail: pilot.email,
              licenseType: 'medical',
              expiryDate: healthExpiry.toLocaleDateString('he-IL'),
              daysUntilExpiry: healthDaysLeft
            };
            
            const success = await sendEmailViaEmailJS(emailData);
            
            if (success) {
              await markReminderSent(db, pilot.id, 'medical', healthExpiry.toISOString().split('T')[0], `${pilot.firstName} ${pilot.lastName}`);
              console.log(`✅ Medical certificate reminder sent to ${pilot.firstName} ${pilot.lastName}`);
              emailsSent++;
            } else {
              console.log(`❌ Failed to send medical reminder to ${pilot.firstName} ${pilot.lastName}`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`⏭️ Medical reminder already sent to ${pilot.firstName} ${pilot.lastName}`);
          }
        }
      }
      
      // Check instructor license - exactly 45 days before expiry
      if (pilot.isInstructor && pilot.instructorLicenseExpiry) {
        const instructorExpiry = new Date(pilot.instructorLicenseExpiry.seconds * 1000);
        const instructorDaysLeft = getDaysUntilExpiry(instructorExpiry);
        
        console.log(`👨‍🏫 Instructor license expires: ${instructorExpiry.toLocaleDateString('he-IL')} (${instructorDaysLeft} days left)`);
        
        if (instructorDaysLeft === 45) {
          const alreadySent = await wasReminderSent(db, pilot.id, 'instructor', instructorExpiry.toISOString().split('T')[0]);
          
          if (!alreadySent) {
            console.log(`📧 Sending instructor reminder to ${pilot.email}`);
            
            const emailData = {
              pilotName: `${pilot.firstName} ${pilot.lastName}`,
              pilotEmail: pilot.email,
              licenseType: 'instructor',
              expiryDate: instructorExpiry.toLocaleDateString('he-IL'),
              daysUntilExpiry: instructorDaysLeft
            };
            
            const success = await sendEmailViaEmailJS(emailData);
            
            if (success) {
              await markReminderSent(db, pilot.id, 'instructor', instructorExpiry.toISOString().split('T')[0], `${pilot.firstName} ${pilot.lastName}`);
              console.log(`✅ Instructor license reminder sent to ${pilot.firstName} ${pilot.lastName}`);
              emailsSent++;
            } else {
              console.log(`❌ Failed to send instructor reminder to ${pilot.firstName} ${pilot.lastName}`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`⏭️ Instructor reminder already sent to ${pilot.firstName} ${pilot.lastName}`);
          }
        }
      }
    }
    
    console.log(`✅ Daily email check completed. ${emailsSent} emails sent.`);
    
  } catch (error) {
    console.error('❌ Error in daily email check:', error);
    process.exit(1);
  }
}

// Run the script
checkAndSendReminders();

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
    console.error('Private key format:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50) + '...');
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
    console.log('🔍 EmailJS Configuration Check:');
    console.log('- Service ID:', process.env.EMAILJS_SERVICE_ID ? '✅ Set' : '❌ Missing');
    console.log('- Template ID:', process.env.EMAILJS_TEMPLATE_ID ? '✅ Set' : '❌ Missing');
    console.log('- Public Key:', process.env.EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
    console.log('- Private Key:', process.env.EMAILJS_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    
    const emailPayload = {
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
    };
    
    console.log('📧 Sending email to:', emailData.pilotEmail);
    console.log('📧 Email payload:', JSON.stringify(emailPayload, null, 2));
    
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', emailPayload);
    
    console.log('📧 EmailJS Response Status:', response.status);
    console.log('📧 EmailJS Response Data:', response.data);

    return response.status === 200;
  } catch (error) {
    console.error('❌ EmailJS error details:');
    console.error('- Error message:', error.message);
    console.error('- Response status:', error.response?.status);
    console.error('- Response data:', error.response?.data);
    console.error('- Full error:', error);
    return false;
  }
}

// Get manager emails for notifications
async function getManagerEmails(db) {
  try {
    console.log('🔍 Querying managerEmails collection...');
    const managersRef = db.collection('managerEmails');
    const snapshot = await managersRef.get();
    
    console.log(`📊 Firebase query results: size=${snapshot.size}, empty=${snapshot.empty}`);
    
    const managerEmails = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📄 Found manager document: ID=${doc.id}, data=`, data);
      managerEmails.push({
        name: data.name,
        email: data.email,
        position: data.position || ''
      });
    });
    
    console.log(`📋 Processed ${managerEmails.length} manager(s) from Firebase`);
    
    return managerEmails;
  } catch (error) {
    console.error('❌ Error getting manager emails:', error);
    console.error('❌ Error details:', error.message);
    return [];
  }
}

// Send emails to both pilot and managers
async function sendEmailToPilotAndManagers(db, emailData, managers) {
  let successCount = 0;
  
  // Send to pilot first
  console.log(`📧 Sending ${emailData.licenseType} reminder to pilot: ${emailData.pilotEmail}`);
  const pilotSuccess = await sendEmailViaEmailJS(emailData);
  if (pilotSuccess) {
    console.log(`✅ Email sent to pilot: ${emailData.pilotName}`);
    successCount++;
  } else {
    console.log(`❌ Failed to send email to pilot: ${emailData.pilotName}`);
  }
  
  // Small delay between emails
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send to all managers
  if (managers.length > 0) {
    console.log(`📧 Sending manager notifications for ${emailData.pilotName} to ${managers.length} manager(s)`);
    
    for (const manager of managers) {
      // Create separate email data for manager with correct recipient
      const managerEmailData = {
        pilotName: emailData.pilotName,
        pilotEmail: manager.email, // Manager receives the email
        licenseType: emailData.licenseType,
        expiryDate: emailData.expiryDate,
        daysUntilExpiry: emailData.daysUntilExpiry
      };
      
      console.log(`📧 Sending to manager: ${manager.name} (${manager.email})`);
      const managerSuccess = await sendEmailViaEmailJS(managerEmailData);
      
      if (managerSuccess) {
        console.log(`✅ Manager notification sent to: ${manager.name}`);
        successCount++;
      } else {
        console.log(`❌ Failed to send manager notification to: ${manager.name}`);
      }
      
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else {
    console.log(`⚠️ No managers found in mailing list - skipping manager notifications`);
  }
  
  return successCount > 0; // Return true if at least one email was sent successfully
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
  console.log('🔍 Starting daily email reminder check... [DEBUG VERSION]');
  
  const db = initializeFirebase();
  const today = new Date();
  
  try {
    // Get manager emails for notifications
    console.log('🔍 Fetching manager emails from Firebase...');
    const managers = await getManagerEmails(db);
    
    console.log(`📋 Manager query completed. Found ${managers.length} manager(s)`);
    
    if (managers.length === 0) {
      console.log('⚠️ WARNING: No managers found in mailing list! Manager notifications will be skipped.');
      console.log('💡 Make sure managers are added via the "ניהול רשימות תפוצה" panel in the web interface.');
    } else {
      console.log(`📋 Manager notification system ready with ${managers.length} manager(s):`);
      managers.forEach((manager, index) => {
        console.log(`   ${index + 1}. ${manager.name} (${manager.email}) ${manager.position ? `- ${manager.position}` : ''}`);
      });
    }
    
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
            
            const success = await sendEmailToPilotAndManagers(db, emailData, managers);
            
            if (success) {
              await markReminderSent(db, pilot.id, 'medical', healthExpiry.toISOString().split('T')[0], `${pilot.firstName} ${pilot.lastName}`);
              console.log(`✅ Medical certificate reminder sent to ${pilot.firstName} ${pilot.lastName} and managers`);
              emailsSent++;
            } else {
              console.log(`❌ Failed to send medical reminder to ${pilot.firstName} ${pilot.lastName}`);
            }
            
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
            
            const success = await sendEmailToPilotAndManagers(db, emailData, managers);
            
            if (success) {
              await markReminderSent(db, pilot.id, 'instructor', instructorExpiry.toISOString().split('T')[0], `${pilot.firstName} ${pilot.lastName}`);
              console.log(`✅ Instructor license reminder sent to ${pilot.firstName} ${pilot.lastName} and managers`);
              emailsSent++;
            } else {
              console.log(`❌ Failed to send instructor reminder to ${pilot.firstName} ${pilot.lastName}`);
            }
            
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

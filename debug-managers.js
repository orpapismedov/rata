#!/usr/bin/env node

// Debug script to check manager emails in Firebase
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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

// Debug manager emails
async function debugManagerEmails() {
  console.log('🔍 Debug: Checking manager emails in Firebase...');
  
  const db = initializeFirebase();
  
  try {
    // Get manager emails
    const managersRef = db.collection('managerEmails');
    const snapshot = await managersRef.get();
    
    console.log(`📊 Raw snapshot size: ${snapshot.size}`);
    console.log(`📊 Snapshot empty: ${snapshot.empty}`);
    
    const managerEmails = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📄 Document ID: ${doc.id}`);
      console.log(`📄 Document data:`, data);
      
      managerEmails.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        position: data.position || ''
      });
    });
    
    console.log(`📋 Total managers found: ${managerEmails.length}`);
    managerEmails.forEach((manager, index) => {
      console.log(`   ${index + 1}. ${manager.name} (${manager.email}) ${manager.position ? `- ${manager.position}` : ''}`);
    });
    
    if (managerEmails.length === 0) {
      console.log('❌ No managers found! Checking collection name and permissions...');
      
      // Try to list all collections
      const collections = await db.listCollections();
      console.log('📁 Available collections:');
      collections.forEach(collection => {
        console.log(`   - ${collection.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking manager emails:', error);
  }
}

// Run the debug
debugManagerEmails();

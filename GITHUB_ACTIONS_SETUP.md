# GitHub Actions Setup Guide

## 📋 Required Steps to Enable Automatic Email Reminders

Your app interface will work exactly the same, but emails will now be sent automatically by GitHub Actions without requiring anyone to open the app.

### 1. Firebase Service Account Setup

You need to create a service account key for GitHub Actions to access Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project **"rata-9e69e"**
3. Click the gear icon (⚙️) → **"Project settings"**
4. Go to **"Service accounts"** tab
5. Click **"Generate new private key"**
6. Save the JSON file securely

### 2. GitHub Secrets Setup

Add these secrets to your GitHub repository:

1. Go to https://github.com/orpapismedov/rata
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"** for each:

**From the Firebase service account JSON file:**
- `FIREBASE_PROJECT_ID`: Your project ID (rata-9e69e)
- `FIREBASE_PRIVATE_KEY`: The private_key from JSON (keep quotes and newlines)
- `FIREBASE_CLIENT_EMAIL`: The client_email from JSON

**From your EmailJS account:**
- `EMAILJS_SERVICE_ID`: Your service ID
- `EMAILJS_TEMPLATE_ID`: Your template ID  
- `EMAILJS_PUBLIC_KEY`: Your public key
- `EMAILJS_PRIVATE_KEY`: Your private key (from EmailJS account settings)

### 3. How It Works

- **Daily Schedule**: Runs every day at 6:00 AM Israel time
- **Automatic**: No user intervention required
- **Reliable**: Uses GitHub's servers, not your devices
- **Free**: Completely free using GitHub Actions
- **Tracking**: Stores sent emails in Firebase to prevent duplicates

### 4. Testing

You can manually trigger the workflow:
1. Go to **"Actions"** tab in your GitHub repository
2. Click **"Daily Email Reminder"** 
3. Click **"Run workflow"**

### 5. Monitoring

Check the **"Actions"** tab to see:
- When emails were sent
- Any errors that occurred
- Detailed logs of the process

## 🔧 What Changed in Your App

- **Frontend**: Exactly the same interface and functionality
- **Backend**: Email reminders now run on GitHub's servers
- **Database**: Email tracking moved from localStorage to Firebase
- **Reliability**: 24/7 automatic operation

Your app will work exactly as before, but now with true automatic email reminders! 🎉

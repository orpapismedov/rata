# UAV License Manager - EmailJS Configuration Guide

## Overview
The UAV License Manager now supports two methods for configuring EmailJS to ensure the automatic 45-day reminders work consistently across all devices:

### Method 1: Environment Variables (Recommended)
This is the preferred method for production deployment as it ensures the configuration works on all devices without requiring manual setup.

### Method 2: Local Configuration
This method stores configuration in the browser's localStorage and requires setup on each device.

## Setting Up EmailJS

### Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://emailjs.com/)
2. Create an account or login
3. Create a new service (Gmail, Outlook, etc.)
4. Create an email template

### Step 2: Get Your Configuration Values
From your EmailJS dashboard, you'll need:
- **Service ID**: Found in the "Email Services" section
- **Template ID**: Found in the "Email Templates" section  
- **Public Key**: Found in the "API Keys" section

### Step 3A: Environment Variables Setup (Recommended)

1. Create or update the `.env.local` file in your project root:

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

2. Replace the placeholder values with your actual EmailJS credentials
3. Restart your development server: `npm run dev`
4. Deploy to production with these environment variables

**Benefits:**
- ✅ Works on all devices automatically
- ✅ Automatic 45-day reminders work consistently
- ✅ No manual configuration needed per device
- ✅ Secure and professional setup

### Step 3B: Local Configuration Setup (Alternative)

If you can't use environment variables, you can configure EmailJS through the admin panel:

1. Login to the admin panel (password: 12891289)
2. Click "התראות מייל" (Email Notifications)
3. Click "הגדר" (Configure) in the EmailJS Settings section
4. Enter your Service ID, Template ID, and Public Key
5. Click "שמור הגדרות" (Save Settings)

**Limitations:**
- ❌ Must be configured on each device/browser
- ❌ Settings lost when browser data is cleared
- ❌ Automatic reminders only work on configured devices

## Email Template Setup

Your EmailJS template should include these variables:
- `{{to_name}}` - Pilot name
- `{{to_email}}` - Pilot email
- `{{certificate_type}}` - Type of certificate (תעודה רפואית/רישיון מדריך)
- `{{expiry_date}}` - Expiration date
- `{{days_until_expiry}}` - Days until expiration
- `{{from_name}}` - System name

### Example Template:
```
שלום {{to_name}},

זוהי תזכורת שה{{certificate_type}} שלך תפוג בתאריך {{expiry_date}} (בעוד {{days_until_expiry}} ימים).

אנא דאג לחדש את התעודה בזמן.

בברכה,
{{from_name}}
```

## Automatic Reminder System

The system automatically checks for licenses expiring in exactly 45 days:
- Runs once daily
- Sends only one reminder per license expiration
- Tracks sent reminders to prevent duplicates
- Works only when EmailJS is properly configured

## Troubleshooting

### Reminders Not Working
1. Check if EmailJS is configured (environment variables or admin panel)
2. Verify all three values are set: Service ID, Template ID, Public Key
3. Check browser console for error messages
4. Test manual email sending through admin panel

### Configuration Issues
- Environment variables: Restart the application after setting them
- Local configuration: Clear browser data and reconfigure if needed
- Production deployment: Ensure environment variables are set in hosting platform

## Security Notes
- Never commit `.env.local` to version control
- Environment variables are the most secure method
- Local configuration is stored in browser localStorage
- Admin password should be changed for production use

## Support
For additional help:
1. Check browser console for error messages
2. Test EmailJS configuration at [EmailJS.com](https://emailjs.com/)
3. Verify template variables match the expected format

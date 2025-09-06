# EmailJS Not Delivering - Troubleshooting Guide

## Status: API returns 200/OK but emails not delivered

### 1. CHECK EMAIL SERVICE CONNECTION (Most Common Issue)
Go to: https://dashboard.emailjs.com/admin/services

Click on your service `service_qmc9ndt` and check:

#### If Using Gmail:
- **App Password Required**: You CANNOT use your regular Gmail password
- Steps to fix:
  1. Enable 2-Factor Authentication on your Gmail account
  2. Go to: https://myaccount.google.com/apppasswords
  3. Generate an app password for "Mail"
  4. In EmailJS service settings, use this app password (not your Gmail password)
  
#### If Using Outlook/Hotmail:
- You may need an app password as well
- Check if 2FA is enabled

#### Service Settings to Verify:
- **Service Status**: Should show "Connected" or "Active"
- **From Email**: Must be a valid email you control
- **Test Connection**: There should be a "Test Connection" button - click it

### 2. CHECK EMAIL HISTORY
Go to: https://dashboard.emailjs.com/admin/emails/history

What do you see?
- **No emails listed** = They're not reaching EmailJS
- **Emails with "Sent" status** = EmailJS sent them, check spam
- **Emails with "Failed" status** = Click for error details
- **Emails with "Blocked" status** = Service configuration issue

### 3. CHECK TEMPLATE "FROM" SETTINGS
Go to: https://dashboard.emailjs.com/admin/templates
Edit `template_teeze8x`, go to Settings tab:

- **From Name**: Should have a value (e.g., "Texas Tailgaters")
- **From Email**: Should be EMPTY to use service default, OR a valid email
- **Reply To**: Should be a valid email or `{{reply_to}}`

### 4. COMMON GMAIL ISSUES

#### "Less secure app access" Error:
- Google discontinued "Less secure apps" in May 2022
- You MUST use an App Password now
- Regular passwords don't work anymore

#### Gmail Blocking:
- Gmail might silently block emails from unverified services
- Check: https://myaccount.google.com/security
- Look for security alerts about blocked sign-in attempts

### 5. TEST WITH A DIFFERENT EMAIL SERVICE

Try creating a new service with a different email provider:
1. Create a new Outlook.com or Yahoo email (for testing)
2. Add it as a new service in EmailJS
3. Update your template to use the new service
4. Test again

### 6. CHECK QUOTA
Free tier = 200 emails/month
Check: https://dashboard.emailjs.com/admin

Have you exceeded your quota?

## IMMEDIATE ACTIONS TO TAKE:

### A. Re-configure Gmail Service (if using Gmail):
1. Go to https://dashboard.emailjs.com/admin/services
2. Click on your service
3. Click "Edit"
4. Update password to an App Password (not regular password)
5. Save and test

### B. Check Actual Email in Service:
The "From Email" in your service configuration - is it:
- A real email you have access to?
- The same email you're using for authentication?

### C. Try EmailJS's Email Tester:
1. Go to your template
2. Click "Test It" button
3. If this works but your app doesn't, it's a field name issue
4. If this also doesn't deliver, it's a service configuration issue

## What to Report Back:
Please check and let me know:
1. **Email Service**: Are you using Gmail, Outlook, or something else?
2. **Password Type**: Are you using an app password or regular password?
3. **Email History**: Do emails appear in the history? What status?
4. **Service Test**: Does the "Test Connection" button in service settings work?
5. **Template Test**: Does the "Test It" button in the template send emails?
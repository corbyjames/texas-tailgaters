# EmailJS Delivery Troubleshooting

## Critical Checks in EmailJS Dashboard

### 1. Check Email History
Go to: https://dashboard.emailjs.com/admin/emails/history

Look for:
- Are your test emails listed there?
- What's the status? (Sent, Failed, Pending)
- Click on any email to see details

### 2. Check Your Email Service Settings
Go to: https://dashboard.emailjs.com/admin/services

For your service (service_qmc9ndt):
- Is it showing as "Active"?
- What email provider is it using? (Gmail, Outlook, etc.)
- Click "Edit" and check:
  - **Send From Email**: Is this a valid email address?
  - **Send From Name**: Is this configured?

### 3. Template Configuration Issues
Go to: https://dashboard.emailjs.com/admin/templates
Edit template_teeze8x

Check the "Settings" tab:
- **To Email**: This should be set to `{{email}}` or `{{to_email}}`
  - If it's hardcoded to a specific email, that's the problem
  - If it's blank, that's the problem
  - If it has a typo like `{{emial}}`, that's the problem

- **From Name**: Should be set (e.g., "Texas Tailgaters")
- **From Email**: Leave blank to use service default OR set a valid email
- **Reply To**: Should be a valid email or `{{reply_to}}`

### 4. Common Issues That Prevent Delivery

1. **Gmail Specific Issues:**
   - If using Gmail as the service, you need an App Password (not regular password)
   - 2FA must be enabled
   - Less secure app access must be allowed

2. **Template "To Email" Field is Wrong:**
   - Most common issue!
   - Should be: `{{email}}` or `{{to_email}}`
   - NOT: A hardcoded email, blank, or misspelled variable

3. **Service Not Properly Connected:**
   - The email service might show "Active" but not actually be connected
   - Try disconnecting and reconnecting the service

4. **Quota Exceeded:**
   - Free tier: 200 emails/month
   - Check: https://dashboard.emailjs.com/admin

### 5. Quick Fix Attempts

1. **In Template Settings, try setting "To Email" to:**
   ```
   {{email}}
   ```

2. **If that doesn't work, try:**
   ```
   {{to_email}}
   ```

3. **Or try the EmailJS default:**
   ```
   {{user_email}}
   ```

### 6. Test with EmailJS's Test Feature

In the template editor, there's a "Test It" button:
1. Click "Test It"
2. Fill in test values
3. See if it actually sends

This bypasses your code entirely and tests just the EmailJS configuration.

## What to Report Back

Please check and let me know:
1. What's shown in Email History?
2. What's the "To Email" field set to in your template?
3. Is your email service showing as properly connected?
4. Did the "Test It" button in the template editor work?
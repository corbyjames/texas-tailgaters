# Twilio SMS Setup Guide for Texas Tailgaters

## Overview
This guide will help you set up real SMS messaging using Twilio.

## Option 1: Quick Setup with Twilio Functions (Serverless)

### Step 1: Create Twilio Account
1. Go to [twilio.com](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account (includes $15 credit)
3. Verify your phone number

### Step 2: Get Your Credentials
1. From Twilio Console, note down:
   - Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Auth Token: `xxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Phone Number: `+1xxxxxxxxxx` (get one from Phone Numbers section)

### Step 3: Set Up Twilio Function (Serverless)
1. Go to Functions & Assets > Services in Twilio Console
2. Create a new service called "texas-tailgaters"
3. Create a new function `/send-sms`
4. Add this code:

```javascript
exports.handler = function(context, event, callback) {
  // Enable CORS
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (event.request.method === 'OPTIONS') {
    return callback(null, response);
  }
  
  const client = context.getTwilioClient();
  const { to, message } = event;
  
  if (!to || !message) {
    response.setStatusCode(400);
    response.setBody({ error: 'Missing required fields: to, message' });
    return callback(null, response);
  }
  
  client.messages
    .create({
      body: message,
      from: context.TWILIO_PHONE_NUMBER,
      to: to
    })
    .then(message => {
      response.setBody({ 
        success: true, 
        messageId: message.sid 
      });
      callback(null, response);
    })
    .catch(error => {
      response.setStatusCode(500);
      response.setBody({ 
        success: false, 
        error: error.message 
      });
      callback(null, response);
    });
};
```

5. Set Environment Variables:
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number

6. Deploy the function
7. Copy the function URL (e.g., `https://texas-tailgaters-xxxx.twil.io/send-sms`)

### Step 4: Update Your App
Add to your `.env` file:
```
VITE_SMS_API_ENDPOINT=https://texas-tailgaters-xxxx.twil.io/send-sms
```

## Option 2: Backend API Setup (Node.js/Express)

### Step 1: Create Backend Server
Create `backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// SMS endpoint
app.post('/api/sms/send', async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: to
    });
    
    res.json({ 
      success: true, 
      messageId: result.sid 
    });
  } catch (error) {
    console.error('SMS Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SMS backend running on port ${PORT}`);
});
```

### Step 2: Install Dependencies
```bash
npm init -y
npm install express cors twilio dotenv
```

### Step 3: Create `.env` file
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
PORT=3001
```

### Step 4: Run the Backend
```bash
node server.js
```

### Step 5: Update Frontend
In your frontend `.env`:
```
VITE_SMS_API_ENDPOINT=http://localhost:3001/api/sms/send
```

## Option 3: Use Email-to-SMS Gateways (Free Alternative)

If you don't want to use Twilio, you can use carrier email gateways:

### Carrier Email Gateways:
- Verizon: `number@vtext.com`
- AT&T: `number@txt.att.net`
- T-Mobile: `number@tmomail.net`
- Sprint: `number@messaging.sprintpcs.com`
- US Cellular: `number@email.uscc.net`
- Cricket: `number@sms.cricketwireless.net`
- Metro PCS: `number@mymetropcs.com`
- Boost: `number@sms.myboostmobile.com`

### Implementation:
The app already supports this through EmailJS. Just select the carrier when sending SMS.

## Testing

1. Open the test page: `/test-sms.html`
2. Try the mock SMS first
3. Once backend is set up, test with real phone numbers

## Costs

### Twilio Pricing:
- Phone Number: $1/month
- SMS (US): $0.0079 per message
- Free trial includes $15 credit (~1,800 messages)

### Email-to-SMS:
- Free (uses EmailJS which you already have)
- But requires knowing recipient's carrier
- May have delays or reliability issues

## Security Notes

⚠️ **NEVER put Twilio credentials in frontend code!**
- Always use a backend server or serverless function
- Keep credentials in environment variables
- Use HTTPS for all API calls
- Consider rate limiting to prevent abuse

## Production Checklist

- [ ] Set up Twilio account
- [ ] Get production phone number
- [ ] Deploy backend/serverless function
- [ ] Update environment variables
- [ ] Test with real phone numbers
- [ ] Add error handling
- [ ] Implement rate limiting
- [ ] Set up monitoring/alerts
- [ ] Document API endpoints
- [ ] Add user consent for SMS

## Support

- Twilio Docs: https://www.twilio.com/docs/sms
- Twilio Console: https://console.twilio.com
- Status Page: https://status.twilio.com
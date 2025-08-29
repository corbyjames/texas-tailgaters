# Firebase Setup Instructions

## Quick Setup (5 minutes)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Name it: "texas-tailgaters"
4. Disable Google Analytics (not needed)
5. Click "Create Project"

### 2. Enable Realtime Database
1. In Firebase Console, click "Realtime Database" in left sidebar
2. Click "Create Database"
3. Choose "United States (us-central1)"
4. Select "Start in test mode" (we'll secure it later)
5. Click "Enable"

### 3. Get Your Config
1. Click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps"
3. Click "</>" (Web) icon
4. Register app as "Texas Tailgaters Web"
5. Copy the firebaseConfig object

### 4. Update Your Config
Replace the config in `src/config/firebase.ts` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Optional: Enable Authentication
1. Click "Authentication" in sidebar
2. Click "Get started"
3. Enable "Email/Password" provider
4. Click "Save"

## That's it! 
Your database is now ready to use. No SQL needed!
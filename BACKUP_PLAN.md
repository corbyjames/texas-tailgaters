# Texas Tailgaters Production Data Backup Plan

## 1. Data Inventory

### Firebase Realtime Database Structure
Based on the current application architecture, the following data needs to be backed up:

#### Critical Data Collections
- **`games/`** - Game schedule and details
  - Game metadata (date, time, opponent, location, TV network)
  - Game status and attendance tracking
  - Score information (home/away scores, game results)
  - Theme assignments and setup times

- **`users/`** - User accounts and profiles
  - User authentication data (managed by Firebase Auth)
  - User profiles (email, name, role)
  - Admin/member role assignments

- **`potluck_items/`** - Event coordination data
  - Food item assignments and details
  - Category organization and quantities
  - User assignments and dietary flags
  - Admin-assigned vs user-assigned items

- **`themes/`** - Game theme configurations
  - Theme definitions and descriptions
  - Color schemes and food suggestions
  - Custom vs predefined themes

#### Firebase Authentication Data
- User accounts and email addresses
- Password hashes (handled by Firebase)
- User metadata and custom claims

#### Estimated Data Volume
- **Current**: ~1-5 MB (small dataset, primarily text)
- **Annual Growth**: ~2-3 MB (one football season per year)
- **5-year projection**: ~15-20 MB

## 2. Backup Strategy

### Multi-Tier Backup Approach

#### Tier 1: Automated Daily Backups (Critical)
- **Frequency**: Every 24 hours at 2:00 AM CT
- **Retention**: 30 days
- **Storage**: Primary cloud storage (Google Cloud Storage)
- **Method**: Firebase Admin SDK automated export

#### Tier 2: Weekly Full Backups (Important)
- **Frequency**: Every Sunday at 1:00 AM CT
- **Retention**: 12 weeks (3 months)
- **Storage**: Secondary cloud storage (AWS S3)
- **Method**: Complete database export with metadata

#### Tier 3: Monthly Archive Backups (Long-term)
- **Frequency**: First Sunday of each month
- **Retention**: 24 months (2 years)
- **Storage**: Cold storage (AWS Glacier)
- **Method**: Compressed full export with documentation

### Backup Types
1. **Hot Backups** - Real-time readable backups in cloud storage
2. **Warm Backups** - Weekly exports for quick recovery
3. **Cold Backups** - Monthly archives for compliance and long-term storage

## 3. Firebase-Specific Backup Methods

### Firebase Realtime Database Export Options

#### Option 1: Firebase Admin SDK (Recommended)
```javascript
// Firebase Admin SDK backup script
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Admin SDK with service account
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://texas-tailgaters-default-rtdb.firebaseio.com'
});

async function exportDatabase() {
  const db = admin.database();
  const snapshot = await db.ref('/').once('value');
  const data = snapshot.val();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`Database exported to ${filename}`);
  
  return { filename, data, timestamp };
}
```

#### Option 2: Firebase REST API
```bash
# Export via REST API (requires authentication)
curl 'https://texas-tailgaters-default-rtdb.firebaseio.com/.json?auth=<ID_TOKEN>' > backup.json
```

#### Option 3: Firebase CLI (Manual)
```bash
# Using Firebase CLI for manual exports
firebase database:get / --output backup.json --project texas-tailgaters
```

### Firebase Authentication Backup
Firebase Auth data requires special handling:

```javascript
// Export user accounts
async function exportUsers() {
  const auth = admin.auth();
  const users = [];
  
  const listUsers = async (nextPageToken) => {
    const result = await auth.listUsers(1000, nextPageToken);
    users.push(...result.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      customClaims: user.customClaims,
      metadata: user.metadata,
      disabled: user.disabled
    })));
    
    if (result.pageToken) {
      await listUsers(result.pageToken);
    }
  };
  
  await listUsers();
  return users;
}
```

## 4. Implementation Steps

### Phase 1: Setup Infrastructure

#### 1.1 Create Service Account
```bash
# Create service account in Firebase Console
# 1. Go to Firebase Console > Project Settings > Service Accounts
# 2. Generate new private key
# 3. Download service-account-key.json
# 4. Store securely in environment variables
```

#### 1.2 Setup Cloud Storage
```javascript
// Google Cloud Storage setup
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  projectId: 'texas-tailgaters',
  keyFilename: 'service-account-key.json'
});

const bucket = storage.bucket('texas-tailgaters-backups');
```

#### 1.3 Install Dependencies
```bash
# Add to package.json
npm install firebase-admin @google-cloud/storage aws-sdk node-cron
```

### Phase 2: Create Backup Scripts

#### 2.1 Main Backup Script (`scripts/backup.js`)
```javascript
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

class FirebaseBackupService {
  constructor() {
    this.initializeFirebase();
    this.initializeStorage();
  }
  
  initializeFirebase() {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  
  initializeStorage() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    });
    this.bucket = this.storage.bucket(process.env.BACKUP_BUCKET_NAME);
  }
  
  async performBackup() {
    try {
      console.log('Starting backup process...');
      
      // Export database
      const dbBackup = await this.exportDatabase();
      
      // Export users
      const usersBackup = await this.exportUsers();
      
      // Create backup package
      const backupData = {
        timestamp: new Date().toISOString(),
        database: dbBackup,
        users: usersBackup,
        metadata: {
          version: '1.0',
          source: 'texas-tailgaters-prod',
          type: 'full-backup'
        }
      };
      
      // Save locally
      const filename = `backup-${Date.now()}.json`;
      const filepath = path.join('./backups', filename);
      fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
      
      // Upload to cloud storage
      await this.uploadToCloud(filepath, filename);
      
      // Cleanup local file
      fs.unlinkSync(filepath);
      
      console.log(`Backup completed: ${filename}`);
      
      // Send notification
      await this.sendNotification('success', filename);
      
      return { success: true, filename };
      
    } catch (error) {
      console.error('Backup failed:', error);
      await this.sendNotification('error', error.message);
      throw error;
    }
  }
  
  async exportDatabase() {
    const db = admin.database();
    const snapshot = await db.ref('/').once('value');
    return snapshot.val();
  }
  
  async exportUsers() {
    const auth = admin.auth();
    const users = [];
    
    const listUsers = async (nextPageToken) => {
      const result = await auth.listUsers(1000, nextPageToken);
      users.push(...result.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        customClaims: user.customClaims,
        metadata: user.metadata,
        disabled: user.disabled
      })));
      
      if (result.pageToken) {
        await listUsers(result.pageToken);
      }
    };
    
    await listUsers();
    return users;
  }
  
  async uploadToCloud(filepath, filename) {
    await this.bucket.upload(filepath, {
      destination: `daily/${filename}`,
      metadata: {
        contentType: 'application/json',
        cacheControl: 'no-cache'
      }
    });
  }
  
  async sendNotification(status, message) {
    // Implement notification logic (email, Slack, etc.)
    console.log(`Backup ${status}: ${message}`);
  }
}

// Initialize backup service
const backupService = new FirebaseBackupService();

// Schedule daily backups (2:00 AM CT)
cron.schedule('0 2 * * *', async () => {
  console.log('Starting scheduled backup...');
  await backupService.performBackup();
}, {
  timezone: "America/Chicago"
});

module.exports = backupService;
```

#### 2.2 Recovery Script (`scripts/restore.js`)
```javascript
const admin = require('firebase-admin');
const fs = require('fs');

class FirebaseRestoreService {
  constructor() {
    this.initializeFirebase();
  }
  
  initializeFirebase() {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  
  async restoreFromBackup(backupFilePath, options = {}) {
    try {
      console.log(`Starting restore from: ${backupFilePath}`);
      
      // Read backup file
      const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
      
      if (options.databaseOnly !== false) {
        await this.restoreDatabase(backupData.database);
      }
      
      if (options.usersOnly !== false) {
        await this.restoreUsers(backupData.users);
      }
      
      console.log('Restore completed successfully');
      
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }
  
  async restoreDatabase(data) {
    const db = admin.database();
    await db.ref('/').set(data);
    console.log('Database restored');
  }
  
  async restoreUsers(users) {
    const auth = admin.auth();
    
    for (const user of users) {
      try {
        await auth.importUsers([{
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          customClaims: user.customClaims,
          disabled: user.disabled
        }]);
      } catch (error) {
        console.error(`Failed to restore user ${user.email}:`, error);
      }
    }
    
    console.log(`Restored ${users.length} users`);
  }
}

module.exports = FirebaseRestoreService;
```

### Phase 3: Deployment Automation

#### 3.1 GitHub Actions Workflow (`.github/workflows/backup.yml`)
```yaml
name: Firebase Backup

on:
  schedule:
    # Run daily at 2:00 AM CT (8:00 AM UTC)
    - cron: '0 8 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: |
        npm install firebase-admin @google-cloud/storage
        
    - name: Run backup
      env:
        FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
        GOOGLE_CLOUD_CREDENTIALS: ${{ secrets.GOOGLE_CLOUD_CREDENTIALS }}
        GOOGLE_CLOUD_PROJECT_ID: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
        BACKUP_BUCKET_NAME: ${{ secrets.BACKUP_BUCKET_NAME }}
      run: node scripts/backup.js
      
    - name: Notify on failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### 3.2 Render.com Cron Job Setup
Since the app is deployed on Render.com, add a cron service:

```yaml
# render.yaml
services:
  - type: web
    name: texas-tailgaters
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    
  - type: cron
    name: texas-tailgaters-backup
    env: node
    schedule: "0 2 * * *" # 2 AM CT daily
    buildCommand: npm install
    startCommand: node scripts/backup.js
```

## 5. Recovery Procedures

### 5.1 Full Database Restore
```bash
# 1. Download backup from cloud storage
gsutil cp gs://texas-tailgaters-backups/daily/backup-TIMESTAMP.json ./

# 2. Run restore script
node scripts/restore.js backup-TIMESTAMP.json

# 3. Verify data integrity
node scripts/verify-backup.js
```

### 5.2 Partial Restore (Specific Collections)
```javascript
// Restore only games data
const restoreService = new FirebaseRestoreService();
await restoreService.restoreFromBackup('backup.json', {
  gamesOnly: true
});
```

### 5.3 Point-in-Time Recovery
```javascript
// Find backup closest to desired timestamp
const targetTime = '2024-12-01T10:00:00Z';
const backups = await listBackups();
const closestBackup = findClosestBackup(backups, targetTime);

await restoreService.restoreFromBackup(closestBackup);
```

### 5.4 Backup Verification Script
```javascript
// scripts/verify-backup.js
class BackupVerifier {
  async verifyBackup(backupFile) {
    const backup = JSON.parse(fs.readFileSync(backupFile));
    
    // Verify structure
    const requiredCollections = ['games', 'users', 'potluck_items', 'themes'];
    for (const collection of requiredCollections) {
      if (!backup.database[collection]) {
        throw new Error(`Missing collection: ${collection}`);
      }
    }
    
    // Verify data integrity
    const gameCount = Object.keys(backup.database.games || {}).length;
    const userCount = backup.users?.length || 0;
    
    console.log(`Backup verified: ${gameCount} games, ${userCount} users`);
    
    return {
      valid: true,
      collections: requiredCollections,
      counts: { games: gameCount, users: userCount }
    };
  }
}
```

## 6. Security Considerations

### 6.1 Encryption
- **In Transit**: All backups transmitted over HTTPS/TLS
- **At Rest**: Cloud storage encryption enabled by default
- **Additional**: GPG encryption for sensitive backups

```bash
# Encrypt backup files
gpg --symmetric --cipher-algo AES256 backup.json
```

### 6.2 Access Control
- Service account with minimal required permissions
- Backup bucket access restricted to backup service only
- Regular rotation of service account keys (quarterly)

### 6.3 Environment Variables
Required secrets in environment:
```bash
# Firebase
FIREBASE_SERVICE_ACCOUNT="{...service account JSON...}"
FIREBASE_DATABASE_URL="https://texas-tailgaters-default-rtdb.firebaseio.com"

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID="texas-tailgaters"
GOOGLE_CLOUD_CREDENTIALS="{...credentials JSON...}"
BACKUP_BUCKET_NAME="texas-tailgaters-backups"

# Notifications
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
ADMIN_EMAIL="admin@texastailgaters.com"
```

### 6.4 Audit Logging
```javascript
// Log all backup operations
const auditLog = {
  timestamp: new Date().toISOString(),
  operation: 'backup',
  status: 'success',
  filename: backupFilename,
  size: backupSize,
  duration: backupDuration
};

await logToAuditSystem(auditLog);
```

## 7. Monitoring and Alerts

### 7.1 Success/Failure Notifications
```javascript
// Email notification service
const nodemailer = require('nodemailer');

async function sendBackupNotification(status, details) {
  const transporter = nodemailer.createTransporter({
    // Configure with your email service
  });
  
  const message = {
    from: 'backups@texastailgaters.com',
    to: 'admin@texastailgaters.com',
    subject: `Backup ${status.toUpperCase()}: Texas Tailgaters`,
    html: `
      <h3>Backup ${status}</h3>
      <p><strong>Timestamp:</strong> ${details.timestamp}</p>
      <p><strong>Filename:</strong> ${details.filename}</p>
      <p><strong>Size:</strong> ${details.size}</p>
      ${status === 'failed' ? `<p><strong>Error:</strong> ${details.error}</p>` : ''}
    `
  };
  
  await transporter.sendMail(message);
}
```

### 7.2 Storage Usage Monitoring
```javascript
// Check storage usage
async function checkStorageUsage() {
  const [files] = await bucket.getFiles();
  const totalSize = files.reduce((sum, file) => sum + parseInt(file.metadata.size), 0);
  
  const sizeInMB = totalSize / (1024 * 1024);
  const sizeInGB = sizeInMB / 1024;
  
  if (sizeInGB > 5) { // Alert if over 5GB
    await sendAlert('storage-warning', `Backup storage usage: ${sizeInGB.toFixed(2)}GB`);
  }
}
```

### 7.3 Backup Health Dashboard
Create a simple monitoring page:
```html
<!-- backup-status.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Texas Tailgaters - Backup Status</title>
</head>
<body>
    <h1>Backup Status Dashboard</h1>
    <div id="backup-status">Loading...</div>
    
    <script>
        async function loadBackupStatus() {
            const response = await fetch('/api/backup-status');
            const status = await response.json();
            
            document.getElementById('backup-status').innerHTML = `
                <h2>Latest Backup</h2>
                <p>Timestamp: ${status.lastBackup.timestamp}</p>
                <p>Status: ${status.lastBackup.success ? 'Success' : 'Failed'}</p>
                <p>Size: ${status.lastBackup.size}</p>
                
                <h2>Storage Usage</h2>
                <p>Total Size: ${status.storage.totalSize}</p>
                <p>File Count: ${status.storage.fileCount}</p>
            `;
        }
        
        loadBackupStatus();
        setInterval(loadBackupStatus, 60000); // Refresh every minute
    </script>
</body>
</html>
```

### 7.4 Automated Testing
```javascript
// Test backup integrity weekly
cron.schedule('0 3 * * 0', async () => {
  console.log('Running weekly backup test...');
  
  // Download latest backup
  const latestBackup = await getLatestBackup();
  
  // Verify backup
  const verifier = new BackupVerifier();
  const result = await verifier.verifyBackup(latestBackup);
  
  if (!result.valid) {
    await sendAlert('backup-test-failed', 'Weekly backup verification failed');
  }
});
```

## 8. Cost Analysis

### 8.1 Google Cloud Storage Costs

#### Storage Costs (per month)
- **Standard Storage**: $0.020 per GB
- **Nearline Storage** (30-day retention): $0.010 per GB  
- **Coldline Storage** (90-day retention): $0.004 per GB
- **Archive Storage** (365-day retention): $0.0012 per GB

#### Data Transfer Costs
- **Egress to Internet**: $0.12 per GB (first 1GB free per month)
- **Regional Egress**: $0.01 per GB

### 8.2 Projected Costs

#### Current Data Volume (~5MB)
- **Daily backups (30 days)**: 150MB × $0.020 = $0.003/month
- **Weekly backups (12 weeks)**: 60MB × $0.010 = $0.0006/month  
- **Monthly archives (24 months)**: 120MB × $0.0012 = $0.0001/month
- **Total Storage**: ~$0.004/month

#### 5-Year Projection (~100MB total)
- **Daily backups**: 3GB × $0.020 = $0.06/month
- **Weekly backups**: 1.2GB × $0.010 = $0.012/month
- **Monthly archives**: 2.4GB × $0.0012 = $0.003/month
- **Total Storage**: ~$0.075/month (~$0.90/year)

#### Additional Service Costs
- **Firebase Admin SDK**: Free (within quotas)
- **GitHub Actions**: Free (2000 minutes/month)
- **Render Cron Service**: $0 (part of existing service)

### 8.3 AWS S3 Alternative Costs

#### Storage Classes
- **Standard**: $0.023 per GB/month
- **Standard-IA**: $0.0125 per GB/month
- **Glacier**: $0.004 per GB/month
- **Glacier Deep Archive**: $0.00099 per GB/month

#### 5-Year Projection (AWS)
- **Standard (hot backups)**: 1GB × $0.023 = $0.023/month
- **Glacier (archives)**: 2GB × $0.004 = $0.008/month
- **Total**: ~$0.031/month (~$0.37/year)

### 8.4 Recommended Storage Strategy

For optimal cost-effectiveness:
1. **Daily backups**: Google Cloud Standard (30 days) - $0.003/month
2. **Weekly backups**: Google Cloud Nearline (90 days) - $0.001/month
3. **Monthly archives**: Google Cloud Archive (2 years) - $0.0003/month

**Total estimated cost**: $0.005/month (~$0.06/year)

## 9. Implementation Timeline

### Week 1: Infrastructure Setup
- [ ] Create Firebase service account
- [ ] Setup Google Cloud Storage bucket
- [ ] Configure environment variables
- [ ] Test basic backup script

### Week 2: Automation Development  
- [ ] Develop main backup script
- [ ] Create recovery procedures
- [ ] Implement error handling
- [ ] Add logging and monitoring

### Week 3: Deployment & Testing
- [ ] Deploy to Render.com cron service
- [ ] Setup GitHub Actions workflow
- [ ] Test full backup/restore cycle
- [ ] Verify notifications

### Week 4: Documentation & Training
- [ ] Complete documentation
- [ ] Create runbooks for recovery
- [ ] Train admin team
- [ ] Schedule regular testing

## 10. Maintenance and Testing

### 10.1 Regular Tasks
- **Weekly**: Verify latest backup integrity
- **Monthly**: Test restore procedure with non-production environment
- **Quarterly**: Rotate service account keys
- **Annually**: Review and update backup retention policies

### 10.2 Disaster Recovery Testing
```javascript
// Quarterly disaster recovery test
async function performDRTest() {
  console.log('Starting disaster recovery test...');
  
  // 1. Create test Firebase project
  // 2. Restore latest backup
  // 3. Verify all data collections
  // 4. Test application functionality
  // 5. Document any issues
  
  const testResults = {
    timestamp: new Date().toISOString(),
    backupFile: latestBackupFile,
    restoreTime: restoreTime,
    dataIntegrity: 'passed',
    functionalTest: 'passed',
    issues: []
  };
  
  await saveTestResults(testResults);
}
```

### 10.3 Backup Monitoring Script
```javascript
// Monitor backup health
const healthCheck = {
  lastBackupAge: calculateAge(latestBackup.timestamp),
  backupSize: latestBackup.size,
  storageUsage: await calculateStorageUsage(),
  upcomingExpirations: await findExpiringBackups()
};

if (healthCheck.lastBackupAge > 25) { // 25 hours
  await sendAlert('backup-overdue', 'Daily backup is overdue');
}
```

## Conclusion

This comprehensive backup plan provides:
- **Automated daily backups** with 30-day retention
- **Multi-tier storage strategy** for cost optimization  
- **Complete disaster recovery procedures**
- **Monitoring and alerting** for backup health
- **Minimal cost** (~$0.06/year) for robust data protection

The implementation uses Firebase Admin SDK for reliable data export, Google Cloud Storage for secure storage, and GitHub Actions for automation. Regular testing ensures backup integrity and recovery procedures remain functional.

**Next Steps:**
1. Create Firebase service account and download credentials
2. Setup Google Cloud Storage bucket with appropriate permissions
3. Deploy backup scripts using the provided code examples
4. Configure monitoring and alerting systems
5. Schedule first disaster recovery test

This plan ensures the Texas Tailgaters application data is protected against all common failure scenarios while maintaining cost-effectiveness and operational simplicity.
const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated:');
console.log('='.repeat(50));
console.log('Add these to your backend/.env file:');
console.log('');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('');
console.log('='.repeat(50));
console.log('Add this to your frontend .env file:');
console.log('');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log('');
console.log('='.repeat(50));
console.log('Save these keys securely. You will need them for push notifications.');
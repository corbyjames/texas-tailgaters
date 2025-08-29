import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeUserAdmin(email) {
  console.log(`🔧 Making ${email} an admin...`);
  
  try {
    // First, create an admin user if it doesn't exist
    const password = 'AdminPassword123!';
    
    // Try to sign up first
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Admin User',
          role: 'admin',
          isAdmin: true
        }
      }
    });
    
    if (signupError && !signupError.message.includes('already registered')) {
      console.log('❌ Error creating user:', signupError.message);
      return;
    }
    
    if (signupData?.user) {
      console.log('✅ Admin user created successfully!');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('   Role: admin');
    } else {
      console.log('ℹ️ User already exists. They need to be updated via Supabase Dashboard.');
      console.log('\nTo make an existing user an admin:');
      console.log('1. Go to https://app.supabase.com');
      console.log('2. Navigate to Authentication → Users');
      console.log(`3. Find ${email}`);
      console.log('4. Click on the user');
      console.log('5. Edit Raw User Meta Data');
      console.log('6. Add: { "role": "admin", "isAdmin": true }');
    }
    
    // Try to sign in to verify
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!signinError && signinData.user) {
      console.log('\n✅ Admin account ready to use!');
      console.log('   You can now sign in with:');
      console.log('   Email:', email);
      console.log('   Password:', password);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Create admin accounts
const adminEmails = [
  'admin@texastailgaters.com',
  'corbyjames@gmail.com' // Make your account admin too
];

async function setupAdmins() {
  for (const email of adminEmails) {
    await makeUserAdmin(email);
    console.log('---');
  }
  
  console.log('\n📝 Note: Existing users need to be updated manually in Supabase Dashboard.');
  console.log('New admin account created: admin@texastailgaters.com / AdminPassword123!');
}

setupAdmins().then(() => process.exit(0));
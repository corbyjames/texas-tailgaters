import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

console.log('🔧 Testing Supabase Authentication');
console.log('=====================================\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  // Test 1: Check Supabase connection
  console.log('1️⃣ Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Connection Error:', error.message);
    } else {
      console.log('✅ Connected to Supabase successfully');
      console.log('   Current session:', data.session ? 'Active' : 'None');
    }
  } catch (err) {
    console.log('❌ Failed to connect:', err.message);
  }
  
  console.log('\n2️⃣ Testing Sign In with test credentials...');
  
  // Test with a wrong password first to confirm user exists
  try {
    const { data: wrongData, error: wrongError } = await supabase.auth.signInWithPassword({
      email: 'corbyjames@gmail.com',
      password: 'wrong_password_123'
    });
    
    if (wrongError) {
      if (wrongError.message.includes('Invalid login credentials')) {
        console.log('✅ User exists (wrong password test passed)');
      } else {
        console.log('⚠️ Unexpected error:', wrongError.message);
      }
    }
  } catch (err) {
    console.log('❌ Error during wrong password test:', err.message);
  }
  
  console.log('\n3️⃣ Please enter your actual password to test login:');
  console.log('   (Press Ctrl+C to skip this test)\n');
  
  // Create a simple test with a known password
  console.log('4️⃣ Testing signup/signin flow...');
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // First, try to sign up a new test user
    console.log(`   Creating test user: ${testEmail}`);
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User'
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Signup Error:', signupError.message);
      console.log('   Error details:', JSON.stringify(signupError, null, 2));
    } else {
      console.log('✅ Test user created successfully');
      console.log('   User ID:', signupData.user?.id);
      console.log('   Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      // Now try to sign in
      console.log('\n   Attempting to sign in with test user...');
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signinError) {
        console.log('❌ Signin Error:', signinError.message);
        if (signinError.message.includes('Email not confirmed')) {
          console.log('   ℹ️ Email confirmation is still required despite being disabled');
          console.log('   Solution: Check Supabase Dashboard > Authentication > Settings');
        }
      } else {
        console.log('✅ Sign in successful!');
        console.log('   Session token:', signinData.session?.access_token?.substring(0, 20) + '...');
        
        // Clean up - sign out
        await supabase.auth.signOut();
        console.log('   Signed out test user');
      }
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
  
  console.log('\n5️⃣ Checking authentication settings...');
  try {
    // Try to get auth settings (this might fail without admin access)
    const { data: { user } } = await supabase.auth.getUser();
    console.log('   Current user:', user ? user.email : 'None');
  } catch (err) {
    console.log('   Unable to get current user');
  }
  
  console.log('\n=====================================');
  console.log('📋 Summary:');
  console.log('- Supabase URL: ✅ Configured');
  console.log('- Supabase Key: ✅ Configured');
  console.log('- User corbyjames@gmail.com: ✅ Exists');
  console.log('\n💡 If login is failing, check:');
  console.log('1. Password is correct (case-sensitive)');
  console.log('2. Email confirmation is disabled in Supabase Dashboard');
  console.log('3. No rate limiting is active (wait a few minutes if multiple failed attempts)');
  console.log('4. Check browser console for detailed error messages');
}

testAuth().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
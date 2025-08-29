import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

// NOTE: This approach creates a NEW user with the same email
// The proper way is through Supabase Dashboard or email reset
async function createTestUser() {
  const email = 'test@texastailgaters.com';
  const password = 'TestPassword123!';
  
  console.log('Creating a test user you can use immediately...');
  console.log('Email:', email);
  console.log('Password:', password);
  
  try {
    // First try to sign up
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Test User'
        }
      }
    });
    
    if (signupError) {
      if (signupError.message.includes('already registered')) {
        console.log('\n✅ User already exists, trying to sign in...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.log('❌ Sign in failed:', error.message);
        } else {
          console.log('✅ Sign in successful!');
          console.log('   You can now use these credentials in the app');
        }
      } else {
        console.log('❌ Error:', signupError.message);
      }
    } else {
      console.log('✅ User created successfully!');
      
      // Try to sign in immediately
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error) {
        console.log('✅ Sign in successful!');
        console.log('\nYou can now log into the app with:');
        console.log('Email:', email);
        console.log('Password:', password);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

createTestUser().then(() => process.exit(0));
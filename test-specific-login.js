import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('🔐 Testing login for corbyjames@gmail.com');
  console.log('=====================================\n');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'corbyjames@gmail.com',
      password: '$4Xanadu4M3e'
    });

    if (error) {
      console.log('❌ Login failed:', error.message);
      console.log('   Error code:', error.status);
      console.log('   Full error:', JSON.stringify(error, null, 2));
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n💡 The password appears to be incorrect.');
        console.log('   Let\'s initiate a password reset...');
        
        // Try to send password reset
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          'corbyjames@gmail.com',
          {
            redirectTo: 'http://localhost:5173/reset-password',
          }
        );
        
        if (resetError) {
          console.log('❌ Password reset failed:', resetError.message);
        } else {
          console.log('✅ Password reset email sent to corbyjames@gmail.com');
          console.log('   Check your email for the reset link');
        }
      }
    } else {
      console.log('✅ Login successful!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);
      console.log('   Session token:', data.session?.access_token?.substring(0, 20) + '...');
      
      // Sign out after successful test
      await supabase.auth.signOut();
      console.log('   Signed out successfully');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testLogin().then(() => process.exit(0));
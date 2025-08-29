import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  try {
    // Try to sign in with the email to check if it exists
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'corbyjames@gmail.com',
      password: 'dummy-password-to-check'
    });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        console.log('✅ User exists with email: corbyjames@gmail.com');
        console.log('   (Password was incorrect, which means the user exists)');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('✅ User exists but email not confirmed: corbyjames@gmail.com');
      } else {
        console.log('❌ Error checking user:', error.message);
      }
    } else {
      console.log('✅ User exists and signed in successfully');
    }
    
    // Also try to get all users (if you have admin access)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (!listError && users) {
      const user = users.find(u => u.email === 'corbyjames@gmail.com');
      if (user) {
        console.log('\n📧 User details:');
        console.log('  - ID:', user.id);
        console.log('  - Email:', user.email);
        console.log('  - Created:', user.created_at);
        console.log('  - Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}

checkUser();
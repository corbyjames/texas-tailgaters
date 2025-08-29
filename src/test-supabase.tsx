import React from 'react';

export function TestSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', url);
  console.log('Supabase Key:', key?.substring(0, 20) + '...');
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Supabase Config Test</h2>
      <p>URL: {url || 'NOT SET'}</p>
      <p>Key: {key ? 'SET (hidden)' : 'NOT SET'}</p>
      <p>Check browser console for details</p>
    </div>
  );
}
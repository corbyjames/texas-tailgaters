#!/usr/bin/env node

console.log('🔧 Creating Tables via Supabase API');
console.log('=====================================\n');

// We'll create a simple HTML file that can be opened in browser to execute the SQL
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, 'supabase', 'create-tables.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Supabase Tables</title>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 10px 10px 0;
        }
        button:hover {
            background: #2563eb;
        }
        button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .success {
            background: #10b981;
        }
        .error {
            background: #ef4444;
        }
        .output {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }
        .status {
            margin-top: 15px;
            padding: 10px;
            border-radius: 6px;
        }
        .status.success {
            background: #d1fae5;
            color: #065f46;
        }
        .status.error {
            background: #fee2e2;
            color: #991b1b;
        }
        .status.info {
            background: #dbeafe;
            color: #1e40af;
        }
        .sql-preview {
            background: #1f2937;
            color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Create Supabase Tables</h1>
        
        <div class="status info">
            ℹ️ This tool will create the necessary tables for the Texas Tailgaters app in your Supabase database.
        </div>
        
        <h3>Tables to create:</h3>
        <ul>
            <li><strong>themes</strong> - Tailgate themes and configurations</li>
            <li><strong>games</strong> - Football game schedule</li>
            <li><strong>potluck_items</strong> - Potluck signup items</li>
        </ul>
        
        <div>
            <button id="checkTables" onclick="checkExistingTables()">1. Check Existing Tables</button>
            <button id="createTables" onclick="executeSQL()" disabled>2. Create Tables</button>
            <button id="verifyTables" onclick="verifyTables()" disabled>3. Verify Creation</button>
        </div>
        
        <div id="output" class="output" style="display:none;"></div>
        
        <details style="margin-top: 30px;">
            <summary style="cursor: pointer; font-weight: bold;">View SQL to be executed</summary>
            <div class="sql-preview">${sqlContent}</div>
        </details>
    </div>

    <script>
        const SUPABASE_URL = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';
        
        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        function showOutput(message, isError = false) {
            const output = document.getElementById('output');
            output.style.display = 'block';
            output.innerHTML += message + '\\n';
            if (isError) {
                output.innerHTML += '<span style="color: red;">' + message + '</span>\\n';
            }
        }
        
        async function checkExistingTables() {
            const output = document.getElementById('output');
            output.style.display = 'block';
            output.innerHTML = 'Checking existing tables...\\n\\n';
            
            const tables = ['games', 'themes', 'potluck_items'];
            let allExist = true;
            
            for (const table of tables) {
                const { data, error } = await supabaseClient
                    .from(table)
                    .select('count')
                    .limit(1);
                
                if (error && error.code === 'PGRST205') {
                    showOutput('❌ Table "' + table + '" does not exist');
                    allExist = false;
                } else if (error) {
                    showOutput('⚠️  Error checking "' + table + '": ' + error.message);
                    allExist = false;
                } else {
                    showOutput('✅ Table "' + table + '" exists');
                }
            }
            
            if (!allExist) {
                showOutput('\\n⚠️  Some tables are missing. Click "Create Tables" to create them.');
                document.getElementById('createTables').disabled = false;
            } else {
                showOutput('\\n✅ All tables already exist!');
                document.getElementById('verifyTables').disabled = false;
            }
        }
        
        async function executeSQL() {
            showOutput('\\n🚀 Creating tables...\\n');
            showOutput('⚠️  Note: Direct SQL execution via JavaScript is not possible with anon key.');
            showOutput('');
            showOutput('Please follow these steps:');
            showOutput('1. Copy the SQL from the preview below');
            showOutput('2. Go to your Supabase SQL Editor:');
            showOutput('   https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new');
            showOutput('3. Paste and run the SQL');
            showOutput('4. Come back and click "Verify Creation"');
            
            document.getElementById('verifyTables').disabled = false;
            
            // Open the Supabase SQL editor in a new tab
            window.open('https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new', '_blank');
        }
        
        async function verifyTables() {
            showOutput('\\n🔍 Verifying table creation...\\n');
            
            const tables = ['themes', 'games', 'potluck_items'];
            let allGood = true;
            
            for (const table of tables) {
                const { data, error } = await supabaseClient
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error && error.code === 'PGRST205') {
                    showOutput('❌ Table "' + table + '" not found');
                    allGood = false;
                } else if (error) {
                    showOutput('⚠️  Error with "' + table + '": ' + error.message);
                    allGood = false;
                } else {
                    showOutput('✅ Table "' + table + '" is ready');
                }
            }
            
            if (allGood) {
                showOutput('\\n🎉 SUCCESS! All tables are created and ready.');
                showOutput('You can now close this window and use the app.');
            } else {
                showOutput('\\n❌ Some tables are still missing.');
                showOutput('Please run the SQL in Supabase Dashboard.');
            }
        }
        
        // Auto-check on load
        window.onload = () => {
            checkExistingTables();
        };
    </script>
</body>
</html>`;

const outputPath = path.join(__dirname, 'create-tables.html');
fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Created: create-tables.html');
console.log('\n📋 Instructions:');
console.log('=====================================');
console.log('1. Open this file in your browser:');
console.log(`   ${outputPath}`);
console.log('\n2. Click "Check Existing Tables" to see what\'s missing');
console.log('3. Follow the on-screen instructions to create tables');
console.log('\nOpening in browser now...');

// Try to open in browser
import { exec } from 'child_process';
exec(`open "${outputPath}"`, (error) => {
  if (error) {
    console.log('\nCouldn\'t auto-open. Please open manually:', outputPath);
  }
});
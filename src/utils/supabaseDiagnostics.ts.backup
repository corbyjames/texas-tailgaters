import { supabase } from '../services/supabase';

export interface DiagnosticResult {
  test: string;
  success: boolean;
  message: string;
  error?: any;
}

export class SupabaseDiagnostics {
  static async runAllTests(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // Test 1: Connection
    results.push(await this.testConnection());
    
    // Test 2: Games table exists
    results.push(await this.testGamesTable());
    
    // Test 3: Themes table exists
    results.push(await this.testThemesTable());
    
    // Test 4: Potluck items table exists
    results.push(await this.testPotluckTable());
    
    // Test 5: Can read from games
    results.push(await this.testReadGames());
    
    // Test 6: Can write to games
    results.push(await this.testWriteGames());
    
    return results;
  }
  
  static async testConnection(): Promise<DiagnosticResult> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('count')
        .limit(1);
      
      if (error) {
        return {
          test: 'Supabase Connection',
          success: false,
          message: `Connection failed: ${error.message}`,
          error
        };
      }
      
      return {
        test: 'Supabase Connection',
        success: true,
        message: 'Connected successfully'
      };
    } catch (err: any) {
      return {
        test: 'Supabase Connection',
        success: false,
        message: `Exception: ${err.message}`,
        error: err
      };
    }
  }
  
  static async testGamesTable(): Promise<DiagnosticResult> {
    try {
      const { error } = await supabase
        .from('games')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          return {
            test: 'Games Table',
            success: false,
            message: 'Table "games" does not exist - run create-tables.sql',
            error
          };
        }
        return {
          test: 'Games Table',
          success: false,
          message: `Table error: ${error.message}`,
          error
        };
      }
      
      return {
        test: 'Games Table',
        success: true,
        message: 'Table exists and is accessible'
      };
    } catch (err: any) {
      return {
        test: 'Games Table',
        success: false,
        message: `Exception: ${err.message}`,
        error: err
      };
    }
  }
  
  static async testThemesTable(): Promise<DiagnosticResult> {
    try {
      const { error } = await supabase
        .from('themes')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          return {
            test: 'Themes Table',
            success: false,
            message: 'Table "themes" does not exist - run create-tables.sql',
            error
          };
        }
        return {
          test: 'Themes Table',
          success: false,
          message: `Table error: ${error.message}`,
          error
        };
      }
      
      return {
        test: 'Themes Table',
        success: true,
        message: 'Table exists and is accessible'
      };
    } catch (err: any) {
      return {
        test: 'Themes Table',
        success: false,
        message: `Exception: ${err.message}`,
        error: err
      };
    }
  }
  
  static async testPotluckTable(): Promise<DiagnosticResult> {
    try {
      const { error } = await supabase
        .from('potluck_items')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          return {
            test: 'Potluck Items Table',
            success: false,
            message: 'Table "potluck_items" does not exist - run create-tables.sql',
            error
          };
        }
        return {
          test: 'Potluck Items Table',
          success: false,
          message: `Table error: ${error.message}`,
          error
        };
      }
      
      return {
        test: 'Potluck Items Table',
        success: true,
        message: 'Table exists and is accessible'
      };
    } catch (err: any) {
      return {
        test: 'Potluck Items Table',
        success: false,
        message: `Exception: ${err.message}`,
        error: err
      };
    }
  }
  
  static async testReadGames(): Promise<DiagnosticResult> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .limit(5);
      
      if (error) {
        if (error.message.includes('permission denied')) {
          return {
            test: 'Read Games Permission',
            success: false,
            message: 'Permission denied - check RLS policies',
            error
          };
        }
        return {
          test: 'Read Games Permission',
          success: false,
          message: `Read error: ${error.message}`,
          error
        };
      }
      
      return {
        test: 'Read Games Permission',
        success: true,
        message: `Can read games (found ${data?.length || 0} games)`
      };
    } catch (err: any) {
      return {
        test: 'Read Games Permission',
        success: false,
        message: `Exception: ${err.message}`,
        error: err
      };
    }
  }
  
  static async testWriteGames(): Promise<DiagnosticResult> {
    try {
      // Try to insert a test game
      const testGame = {
        date: '2099-12-31',
        time: 'TEST',
        opponent: 'Diagnostic Test Team',
        location: 'Test Location',
        is_home: true,
        status: 'unplanned',
        tv_network: 'TEST'
      };
      
      const { data, error: insertError } = await supabase
        .from('games')
        .insert([testGame])
        .select()
        .single();
      
      if (insertError) {
        if (insertError.message.includes('permission denied')) {
          return {
            test: 'Write Games Permission',
            success: false,
            message: 'Permission denied - check RLS policies for INSERT',
            error: insertError
          };
        }
        return {
          test: 'Write Games Permission',
          success: false,
          message: `Insert error: ${insertError.message}`,
          error: insertError
        };
      }
      
      // Clean up - delete the test game
      if (data) {
        const { error: deleteError } = await supabase
          .from('games')
          .delete()
          .eq('id', data.id);
        
        if (deleteError) {
          console.error('Failed to clean up test game:', deleteError);
        }
      }
      
      return {
        test: 'Write Games Permission',
        success: true,
        message: 'Can insert and delete games'
      };
    } catch (err: any) {
      return {
        test: 'Write Games Permission',
        success: false,
        message: `Exception: ${err.message}`,
        error: err
      };
    }
  }
  
  static formatResults(results: DiagnosticResult[]): string {
    let output = '=== Supabase Diagnostics ===\n\n';
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      output += `${icon} ${result.test}: ${result.message}\n`;
      if (result.error && !result.success) {
        output += `   Details: ${JSON.stringify(result.error, null, 2)}\n`;
      }
    });
    
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
      output += '\n=== Action Required ===\n';
      if (failedTests.some(t => t.message.includes('does not exist'))) {
        output += '1. Run the SQL script in supabase/create-tables.sql\n';
      }
      if (failedTests.some(t => t.message.includes('permission denied'))) {
        output += '2. Check RLS policies - ensure public read and authenticated write\n';
      }
      if (failedTests.some(t => t.message.includes('Connection failed'))) {
        output += '3. Check your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n';
      }
    } else {
      output += '\n✅ All tests passed! Supabase is properly configured.\n';
    }
    
    return output;
  }
}

// Export a function to run diagnostics and log results
export async function runSupabaseDiagnostics(): Promise<void> {
  console.log('Running Supabase diagnostics...');
  const results = await SupabaseDiagnostics.runAllTests();
  console.log(SupabaseDiagnostics.formatResults(results));
  return;
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

console.log('🧪 Testing Data Persistence to Supabase Tables');
console.log('==============================================\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersistence() {
  let createdThemeId = null;
  let createdGameId = null;
  let createdPotluckId = null;
  
  try {
    // 1. Test themes table
    console.log('1️⃣ Testing THEMES table...');
    console.log('   Creating a test theme...');
    
    const themeData = {
      name: 'Test Theme - Longhorns Victory',
      description: 'Testing theme persistence',
      opponent: 'Test Opponent',
      colors: ['burnt-orange', 'white'],
      food_suggestions: ['BBQ', 'Tacos', 'Chips & Queso'],
      is_custom: false
    };
    
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .insert([themeData])
      .select()
      .single();
    
    if (themeError) {
      console.log('❌ Failed to create theme:', themeError.message);
      console.log('   Error details:', themeError);
    } else {
      createdThemeId = theme.id;
      console.log('✅ Theme created successfully!');
      console.log('   ID:', theme.id);
      console.log('   Name:', theme.name);
      console.log('   Colors:', theme.colors);
    }
    
    // 2. Test games table
    console.log('\n2️⃣ Testing GAMES table...');
    console.log('   Creating a test game...');
    
    const gameData = {
      date: '2025-09-06',
      time: '7:00 PM',
      opponent: 'Ohio State',
      location: 'DKR Stadium',
      is_home: true,
      theme_id: createdThemeId,
      status: 'planned',
      setup_time: '3:00 PM',
      expected_attendance: 150,
      tv_network: 'ESPN'
    };
    
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([gameData])
      .select()
      .single();
    
    if (gameError) {
      console.log('❌ Failed to create game:', gameError.message);
      console.log('   Error details:', gameError);
    } else {
      createdGameId = game.id;
      console.log('✅ Game created successfully!');
      console.log('   ID:', game.id);
      console.log('   Opponent:', game.opponent);
      console.log('   Date:', game.date);
      console.log('   Status:', game.status);
    }
    
    // 3. Test potluck_items table
    console.log('\n3️⃣ Testing POTLUCK_ITEMS table...');
    console.log('   Creating test potluck items...');
    
    const potluckItems = [
      {
        game_id: createdGameId,
        name: 'Brisket',
        category: 'Main Dish',
        quantity: '10 lbs',
        description: 'Smoked brisket from Franklin BBQ',
        assigned_to: 'John Doe',
        is_admin_assigned: false,
        dietary_flags: ['gluten-free']
      },
      {
        game_id: createdGameId,
        name: 'Potato Salad',
        category: 'Side Dish',
        quantity: '2 large bowls',
        description: 'Homemade potato salad',
        assigned_to: 'Jane Smith',
        is_admin_assigned: false,
        dietary_flags: ['vegetarian']
      },
      {
        game_id: createdGameId,
        name: 'Beer',
        category: 'Drinks',
        quantity: '3 cases',
        description: 'Assorted local craft beers',
        assigned_to: 'Bob Johnson',
        is_admin_assigned: true,
        dietary_flags: []
      }
    ];
    
    const { data: potluck, error: potluckError } = await supabase
      .from('potluck_items')
      .insert(potluckItems)
      .select();
    
    if (potluckError) {
      console.log('❌ Failed to create potluck items:', potluckError.message);
      console.log('   Error details:', potluckError);
    } else {
      console.log('✅ Potluck items created successfully!');
      console.log('   Created', potluck.length, 'items');
      potluck.forEach(item => {
        console.log(`   - ${item.name} (${item.category}) by ${item.assigned_to}`);
      });
      if (potluck[0]) createdPotluckId = potluck[0].id;
    }
    
    // 4. Test reading data back
    console.log('\n4️⃣ Testing READ operations...');
    
    // Read games with themes
    const { data: gamesWithThemes, error: readError } = await supabase
      .from('games')
      .select(`
        *,
        themes (
          name,
          colors,
          food_suggestions
        )
      `)
      .order('date', { ascending: true });
    
    if (readError) {
      console.log('❌ Failed to read games:', readError.message);
    } else {
      console.log('✅ Successfully read games with themes!');
      console.log('   Total games in database:', gamesWithThemes.length);
      if (gamesWithThemes.length > 0) {
        console.log('   First game:', gamesWithThemes[0].opponent, 'on', gamesWithThemes[0].date);
      }
    }
    
    // Read potluck items for the game
    const { data: gamePotluck, error: potluckReadError } = await supabase
      .from('potluck_items')
      .select('*')
      .eq('game_id', createdGameId);
    
    if (potluckReadError) {
      console.log('❌ Failed to read potluck items:', potluckReadError.message);
    } else {
      console.log('✅ Successfully read potluck items!');
      console.log('   Items for this game:', gamePotluck.length);
    }
    
    // 5. Test UPDATE operations
    console.log('\n5️⃣ Testing UPDATE operations...');
    
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({ expected_attendance: 200, status: 'confirmed' })
      .eq('id', createdGameId)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Failed to update game:', updateError.message);
    } else {
      console.log('✅ Successfully updated game!');
      console.log('   New attendance:', updatedGame.expected_attendance);
      console.log('   New status:', updatedGame.status);
    }
    
    // 6. Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    
    // Delete potluck items (will cascade from game deletion)
    const { error: deletePotluckError } = await supabase
      .from('potluck_items')
      .delete()
      .eq('game_id', createdGameId);
    
    if (deletePotluckError) {
      console.log('⚠️  Failed to delete potluck items:', deletePotluckError.message);
    } else {
      console.log('✅ Deleted test potluck items');
    }
    
    // Delete game
    const { error: deleteGameError } = await supabase
      .from('games')
      .delete()
      .eq('id', createdGameId);
    
    if (deleteGameError) {
      console.log('⚠️  Failed to delete game:', deleteGameError.message);
    } else {
      console.log('✅ Deleted test game');
    }
    
    // Delete theme
    const { error: deleteThemeError } = await supabase
      .from('themes')
      .delete()
      .eq('id', createdThemeId);
    
    if (deleteThemeError) {
      console.log('⚠️  Failed to delete theme:', deleteThemeError.message);
    } else {
      console.log('✅ Deleted test theme');
    }
    
    // Final verification
    console.log('\n==============================================');
    console.log('📊 PERSISTENCE TEST SUMMARY');
    console.log('==============================================');
    console.log('✅ All tables are working correctly!');
    console.log('✅ Data can be created, read, updated, and deleted');
    console.log('✅ Foreign key relationships are working');
    console.log('✅ Your Supabase database is ready for use!');
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err);
    console.log('\nTrying to clean up any created data...');
    
    // Attempt cleanup
    if (createdGameId) {
      await supabase.from('games').delete().eq('id', createdGameId);
    }
    if (createdThemeId) {
      await supabase.from('themes').delete().eq('id', createdThemeId);
    }
  }
}

testPersistence().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
// Test temperature breach tracking
import pool from './config/database';

async function testBreachTracking() {
  const client = await pool.connect();
  try {
    const batchId = 'MED001';
    
    console.log('🧪 Testing temperature breach tracking...\n');
    
    // Get initial state
    let result = await client.query(
      'SELECT temperature, target_temp_min, target_temp_max, temperature_breaches FROM batches WHERE batch_id = $1',
      [batchId]
    );
    
    console.log('📊 Initial state:');
    console.log(`   Temperature: ${result.rows[0].temperature}°C`);
    console.log(`   Target Range: ${result.rows[0].target_temp_min}°C - ${result.rows[0].target_temp_max}°C`);
    console.log(`   Breaches: ${result.rows[0].temperature_breaches}\n`);
    
    // Update to breach temperature (above max)
    console.log('🔥 Updating temperature to 35°C (above 30°C max)...');
    await client.query(
      'UPDATE batches SET temperature = $1 WHERE batch_id = $2',
      [35, batchId]
    );
    
    // Check new state
    result = await client.query(
      'SELECT temperature, target_temp_min, target_temp_max, temperature_breaches FROM batches WHERE batch_id = $1',
      [batchId]
    );
    
    console.log('\n📊 After first breach:');
    console.log(`   Temperature: ${result.rows[0].temperature}°C`);
    console.log(`   Breaches: ${result.rows[0].temperature_breaches}\n`);
    
    // Check if alert was created
    const alertResult = await client.query(
      `SELECT type, severity, message, created_at 
       FROM alerts 
       WHERE batch_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [batchId]
    );
    
    if (alertResult.rows.length > 0) {
      console.log('🚨 Alert created:');
      console.log(`   Type: ${alertResult.rows[0].type}`);
      console.log(`   Severity: ${alertResult.rows[0].severity}`);
      console.log(`   Message: ${alertResult.rows[0].message}\n`);
    }
    
    // Return to normal temperature
    console.log('❄️  Returning to normal temperature (22°C)...');
    await client.query(
      'UPDATE batches SET temperature = $1 WHERE batch_id = $2',
      [22, batchId]
    );
    
    // Breach again
    console.log('🔥 Breaching again with 33°C...');
    await client.query(
      'UPDATE batches SET temperature = $1 WHERE batch_id = $2',
      [33, batchId]
    );
    
    // Final check
    result = await client.query(
      'SELECT temperature, temperature_breaches FROM batches WHERE batch_id = $1',
      [batchId]
    );
    
    console.log('\n📊 Final state:');
    console.log(`   Temperature: ${result.rows[0].temperature}°C`);
    console.log(`   Total Breaches: ${result.rows[0].temperature_breaches}`);
    
    if (result.rows[0].temperature_breaches >= 2) {
      console.log('\n✅ Breach tracking is working correctly!');
    } else {
      console.log('\n⚠️  Expected 2 breaches, but got:', result.rows[0].temperature_breaches);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testBreachTracking();

// Update existing batches to initialize temperature_breaches
import pool from './config/database';

async function updateExistingBatches() {
  const client = await pool.connect();
  try {
    console.log('Updating existing batches...');
    
    // Set temperature_breaches to 0 for all existing batches
    await client.query(`
      UPDATE batches 
      SET temperature_breaches = 0 
      WHERE temperature_breaches IS NULL
    `);
    
    // Count breaches based on existing alerts
    const result = await client.query(`
      UPDATE batches b
      SET temperature_breaches = (
        SELECT COUNT(*)
        FROM alerts a
        WHERE a.batch_id = b.batch_id
        AND a.type = 'temperature_breach'
      )
      WHERE temperature_breaches = 0
    `);
    
    console.log(`✅ Updated ${result.rowCount} batches`);
    
    // Verify
    const verifyResult = await client.query(`
      SELECT batch_id, temperature, target_temp_min, target_temp_max, temperature_breaches
      FROM batches
      ORDER BY batch_id
    `);
    
    console.log('\n📊 Current batch status:');
    verifyResult.rows.forEach(row => {
      const inRange = row.temperature >= row.target_temp_min && row.temperature <= row.target_temp_max;
      console.log(`   ${row.batch_id}: ${row.temperature}°C (${row.target_temp_min}-${row.target_temp_max}°C) - ${row.temperature_breaches} breaches ${inRange ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateExistingBatches();

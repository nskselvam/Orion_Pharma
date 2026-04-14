// Migration script to add temperature_breaches column
import pool from './config/database';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: add_temperature_breaches...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_temperature_breaches.sql'),
      'utf8'
    );
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added temperature_breaches column');
    console.log('   - Created track_temperature_breach() function');
    console.log('   - Created temperature_breach_tracker trigger');
    
    // Test query to verify
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'batches' AND column_name = 'temperature_breaches'
    `);
    
    if (result.rows.length > 0) {
      console.log('\n✅ Verification: temperature_breaches column exists');
      console.log(result.rows[0]);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

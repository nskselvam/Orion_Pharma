import pool from '../config/database';

const clearDemoData = async () => {
  await pool.query('BEGIN');
  try {
    await pool.query('DELETE FROM logs');
    await pool.query('DELETE FROM alerts');
    await pool.query('DELETE FROM batch_stages');
    await pool.query('DELETE FROM batches');
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const seedBatches = async () => {
  // Delivered, safe batch at pharmacy
  await pool.query(
    `INSERT INTO batches (
      batch_id, medicine_name, origin, origin_lat, origin_lng,
      destination, destination_lat, destination_lng,
      quantity_in_stock, current_stage, temperature,
      target_temp_min, target_temp_max, temperature_breaches,
      trust_score, status, blockchain_hash
    ) VALUES (
      'MED101', 'Insulin-X', 'Hyderabad, India', 17.3850, 78.4867,
      'Apollo Pharmacy, Bengaluru', 12.9716, 77.5946,
      140, 'pharmacy', 6.0,
      2.0, 8.0, 0,
      95, 'delivered', 'demo-hash-med101'
    )`
  );

  // Compromised batch at pharmacy (quarantined)
  await pool.query(
    `INSERT INTO batches (
      batch_id, medicine_name, origin, origin_lat, origin_lng,
      destination, destination_lat, destination_lng,
      quantity_in_stock, current_stage, temperature,
      target_temp_min, target_temp_max, temperature_breaches,
      trust_score, status, blockchain_hash
    ) VALUES (
      'MED102', 'Vaccine-Pro', 'Pune, India', 18.5204, 73.8567,
      'City Hospital Pharmacy, Mumbai', 19.0760, 72.8777,
      80, 'pharmacy', 13.0,
      2.0, 8.0, 3,
      42, 'compromised', 'demo-hash-med102'
    )`
  );

  // In-transit batch
  await pool.query(
    `INSERT INTO batches (
      batch_id, medicine_name, origin, origin_lat, origin_lng,
      destination, destination_lat, destination_lng,
      quantity_in_stock, current_stage, temperature,
      target_temp_min, target_temp_max, temperature_breaches,
      trust_score, status, blockchain_hash
    ) VALUES (
      'MED103', 'CardioTab', 'Ahmedabad, India', 23.0225, 72.5714,
      'Metro Pharmacy, Chennai', 13.0827, 80.2707,
      300, 'distributor', 7.0,
      2.0, 8.0, 1,
      76, 'in-transit', 'demo-hash-med103'
    )`
  );
};

const seedStages = async () => {
  // MED101 route
  await pool.query(
    `INSERT INTO batch_stages (batch_id, name, location, temperature, coordinates_lat, coordinates_lng, timestamp)
     VALUES
      ('MED101', 'Manufacturer Facility', 'manufacturer', 5.8, 17.3850, 78.4867, NOW() - INTERVAL '3 days'),
      ('MED101', 'Cold Storage Warehouse', 'warehouse', 6.2, 15.2993, 74.1240, NOW() - INTERVAL '2 days'),
      ('MED101', 'Regional Distributor', 'distributor', 6.4, 13.3392, 77.1135, NOW() - INTERVAL '1 day'),
      ('MED101', 'Apollo Pharmacy', 'pharmacy', 6.0, 12.9716, 77.5946, NOW() - INTERVAL '2 hours')`
  );

  // MED102 route (breached)
  await pool.query(
    `INSERT INTO batch_stages (batch_id, name, location, temperature, coordinates_lat, coordinates_lng, timestamp)
     VALUES
      ('MED102', 'Manufacturer Facility', 'manufacturer', 5.0, 18.5204, 73.8567, NOW() - INTERVAL '4 days'),
      ('MED102', 'Cold Storage Warehouse', 'warehouse', 9.5, 19.9975, 73.7898, NOW() - INTERVAL '3 days'),
      ('MED102', 'Regional Distributor', 'distributor', 11.8, 19.2183, 72.9781, NOW() - INTERVAL '2 days'),
      ('MED102', 'City Hospital Pharmacy', 'pharmacy', 13.0, 19.0760, 72.8777, NOW() - INTERVAL '3 hours')`
  );

  // MED103 route (in transit)
  await pool.query(
    `INSERT INTO batch_stages (batch_id, name, location, temperature, coordinates_lat, coordinates_lng, timestamp)
     VALUES
      ('MED103', 'Manufacturer Facility', 'manufacturer', 4.9, 23.0225, 72.5714, NOW() - INTERVAL '2 days'),
      ('MED103', 'Cold Storage Warehouse', 'warehouse', 6.8, 21.1702, 72.8311, NOW() - INTERVAL '1 day'),
      ('MED103', 'Regional Distributor', 'distributor', 7.0, 17.6868, 83.2185, NOW() - INTERVAL '1 hour')`
  );
};

const seedAlertsAndLogs = async () => {
  await pool.query(
    `INSERT INTO alerts (batch_id, type, severity, message, details, resolved)
     VALUES
      ('MED102', 'temperature_breach', 'critical', 'Critical cold-chain breach detected at pharmacy intake', '{"temperature":13,"allowedRange":"2-8"}', false),
      ('MED102', 'trust_critical', 'high', 'Trust score dropped below safe threshold', '{"trustScore":42}', false),
      ('MED103', 'predicted_breach', 'medium', 'Model predicts potential breach in next transit leg', '{"confidence":0.82}', false)`
  );

  await pool.query(
    `INSERT INTO logs (batch_id, type, value)
     VALUES
      ('MED101', 'temperature', '{"temperature":6.0,"stage":"pharmacy"}'),
      ('MED102', 'temperature', '{"temperature":13.0,"stage":"pharmacy"}'),
      ('MED102', 'alert', '{"event":"critical_breach"}'),
      ('MED103', 'location', '{"stage":"distributor"}')`
  );
};

const run = async () => {
  try {
    console.log('Seeding deterministic hackathon demo dataset...');
    await clearDemoData();
    await seedBatches();
    await seedStages();
    await seedAlertsAndLogs();
    console.log('Demo seed complete. Batches: MED101, MED102, MED103');
  } catch (error) {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();

-- PostgreSQL Schema for Orion-PharmaTics
-- Pharmaceutical Supply Chain Management System

-- Drop existing tables if they exist
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS batch_stages CASCADE;
DROP TABLE IF EXISTS batches CASCADE;

-- Create enum types
CREATE TYPE batch_stage_enum AS ENUM ('manufacturer', 'warehouse', 'distributor', 'pharmacy');
CREATE TYPE batch_status_enum AS ENUM ('in-transit', 'delivered', 'compromised');
CREATE TYPE alert_type_enum AS ENUM ('temperature_breach', 'predicted_breach', 'delay', 'route_deviation', 'trust_critical');
CREATE TYPE alert_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE log_type_enum AS ENUM ('temperature', 'location', 'trust_score', 'alert');

-- Batches table
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    destination VARCHAR(255) NOT NULL,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    quantity_in_stock INTEGER CHECK (quantity_in_stock >= 0),
    current_stage batch_stage_enum DEFAULT 'manufacturer',
    temperature DECIMAL(5, 2) NOT NULL DEFAULT 25.0,
    target_temp_min DECIMAL(5, 2) DEFAULT 15.0,
    target_temp_max DECIMAL(5, 2) DEFAULT 30.0,
    temperature_breaches INTEGER DEFAULT 0 CHECK (temperature_breaches >= 0),
    trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
    status batch_status_enum DEFAULT 'in-transit',
    is_recalled BOOLEAN DEFAULT FALSE,
    blockchain_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Batch stages table (for tracking shipment stages)
CREATE TABLE batch_stages (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    temperature DECIMAL(5, 2),
    coordinates_lat DECIMAL(10, 8),
    coordinates_lng DECIMAL(11, 8)
);

-- Alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    type alert_type_enum NOT NULL,
    severity alert_severity_enum NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs table
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    type log_type_enum NOT NULL,
    value JSONB NOT NULL,
    previous_value JSONB,
    blockchain_hash VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_batches_batch_id ON batches(batch_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_current_stage ON batches(current_stage);
CREATE INDEX idx_batches_created_at ON batches(created_at DESC);

CREATE INDEX idx_batch_stages_batch_id ON batch_stages(batch_id);
CREATE INDEX idx_batch_stages_timestamp ON batch_stages(timestamp DESC);

CREATE INDEX idx_alerts_batch_id ON alerts(batch_id);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_batch_resolved_created ON alerts(batch_id, resolved, created_at DESC);

CREATE INDEX idx_logs_batch_id ON logs(batch_id);
CREATE INDEX idx_logs_type ON logs(type);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_batch_timestamp ON logs(batch_id, timestamp DESC);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    -- Recall has top priority and should not be auto-overwritten.
    IF NEW.is_recalled = TRUE THEN
        RETURN NEW;
    END IF;
    
    -- Update status based on trust score
    IF NEW.trust_score < 50 THEN
        NEW.status = 'compromised';
    ELSIF NEW.current_stage = 'pharmacy' THEN
        NEW.status = 'delivered';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
-- INSERT INTO batches (batch_id, medicine_name, origin, destination, origin_lat, origin_lng, destination_lat, destination_lng, quantity_in_stock, temperature)
-- VALUES 
--     ('MED001', 'Paracetamol', 'Mumbai Warehouse', 'Delhi Hospital', 19.0760, 72.8777, 28.7041, 77.1025, 1000, 22.5),
--     ('MED002', 'Insulin', 'Bangalore Lab', 'Chennai Pharmacy', 12.9716, 77.5946, 13.0827, 80.2707, 500, 4.5);

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO orion_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO orion_user;
